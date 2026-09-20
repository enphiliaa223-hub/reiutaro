-- ============================================================================
-- REIUTAROU — 0005_store (Phase 8)
-- RPC create_order: harga SELALU dihitung ulang server-side (anti forge).
-- Pembayaran V1 = manual oleh admin; PaymentService abstraction untuk V2.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- create_order — buat order dari cart user aktif.
-- security definer (bypass RLS) karena TOTAL dihitung selalu dari tabel
-- products, bukan dari angka yang dibawa client. Hanya untuk user sendiri
-- (auth.uid()). Karena ini bukan operasi admin, grant ke authenticated.
-- ----------------------------------------------------------------------------
create or replace function app.create_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text default null,
  p_customer_address text default null,
  p_notes text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user    uuid := auth.uid();
  v_cart_id uuid;
  v_lines   jsonb;
  v_subtotal numeric(12,2) := 0;
  v_order_id uuid;
  v_order_number text;
  r record;
begin
  if v_user is null then
    raise exception 'E_NOT_AUTHENTICATED';
  end if;

  select id into v_cart_id from carts where user_id = v_user;
  if v_cart_id is null then
    raise exception 'E_CART_EMPTY';
  end if;

  -- Validasi stok sebelum apa pun (lock baris produk).
  for r in
    select ci.quantity, p.stock
    from cart_items ci join products p on p.id = ci.product_id
    where ci.cart_id = v_cart_id
    for update of p
  loop
    if r.quantity > r.stock then
      raise exception 'E_STOCK:%', r.product_id;
    end if;
  end loop;

  select coalesce(jsonb_agg(jsonb_build_object(
           'product_id',   p.id,
           'product_name', p.name,
           'unit_price',   p.price,
           'quantity',     ci.quantity,
           'subtotal',     round((p.price * ci.quantity)::numeric, 2)
         )), '[]'::jsonb)
  into v_lines
  from cart_items ci
  join products p on p.id = ci.product_id
  where ci.cart_id = v_cart_id
    and p.status = 'active';

  if jsonb_array_length(v_lines) = 0 then
    raise exception 'E_CART_EMPTY';
  end if;

  select sum((line->>'subtotal')::numeric) into v_subtotal
  from jsonb_array_elements(v_lines) line;

  v_order_number := 'REI-' || to_char(now(), 'YYYYMMDD') || '-' ||
                    upper(substr(md5(random()::text), 1, 6));

  insert into orders (
    order_number, user_id, status, payment_status,
    customer_name, customer_email, customer_phone, customer_address, notes,
    subtotal, total, currency
  ) values (
    v_order_number, v_user, 'awaiting_payment', 'pending',
    p_customer_name, p_customer_email, p_customer_phone, p_customer_address, p_notes,
    v_subtotal, v_subtotal, 'USD'
  ) returning id into v_order_id;

  insert into order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
  select
    v_order_id,
    (line->>'product_id')::uuid,
    line->>'product_name',
    (line->>'unit_price')::numeric,
    (line->>'quantity')::int,
    (line->>'subtotal')::numeric
  from jsonb_array_elements(v_lines) line;

  -- Kosongkan cart (baris row tetap disimpan untuk user).
  delete from cart_items where cart_id = v_cart_id;

  return jsonb_build_object(
    'order_id',     v_order_id,
    'order_number', v_order_number,
    'subtotal',     v_subtotal,
    'total',        v_subtotal
  );
end;
$$;

grant execute on function app.create_order(text, text, text, text, text) to authenticated;

-- ----------------------------------------------------------------------------
-- Policy: admin boleh akses semua order + create_order memakai definer.
-- order insert dari client tetap tidak boleh (angka harga harus dari RPC).
-- ----------------------------------------------------------------------------
create policy "order_items_admin_all" on public.order_items
  for all using (app.is_admin()) with check (app.is_admin());