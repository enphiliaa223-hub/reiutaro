-- ============================================================================
-- REIUTAROU — 0011_bootstrap_production
-- Perbaikan menyeluruh untuk produksi. SEMUA pernyataan idempotent — aman
-- dijalankan berulang kali lewat Supabase SQL Editor.
--
-- Memperbaiki 3 hal yang rusak sekaligus:
--   1. Bucket storage TIDAK ADA di proyek online (probe: []). Ini penyebab
--      upload lagu/cover/gambar produk & avatar selalu gagal.
--   2. RPC create_order / adjust_stock / bump_rate_limit tidak tersedia di API
--      (public schema) — penyebab checkout user gagal & kejelasan error.
--   3. Role 'seller', helper app.is_seller/app.is_staff, policy kelola produk
--      untuk seller, dan guard role/status hanya-admin belum ada — jumlah
--      dengan 0009 + 0010 agar panel Pengguna & kelola akun berfungsi penuh.
-- ============================================================================

-- ============================================================================
-- 1. STORAGE: buat/update SEMUA bucket (idempotent)
--    music diizinkan menerima audio + gambar cover (perbaikan 0010).
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',   'avatars',   true, 5242880,  array['image/png','image/jpeg','image/webp']),
  ('community', 'community', true, 10485760, array['image/png','image/jpeg','image/webp','image/gif']),
  ('projects',  'projects',  true, 10485760, array['image/png','image/jpeg','image/webp']),
  ('products',  'products',  true, 10485760, array['image/png','image/jpeg','image/webp']),
  ('music',     'music',     true, 26214400, array['audio/mpeg','audio/ogg','audio/mp4','audio/webm','image/png','image/jpeg','image/webp']),
  ('media',     'media',     true, 10485760, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================================
-- 1b. HELPER ROLE (harus dibuat SEBELUM policy storage yang menggunakannya)
-- ============================================================================
create or replace function app.is_seller()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'seller' and status = 'active'
  );
$$;

create or replace function app.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select app.is_admin() or app.is_seller();
$$;

-- ============================================================================
-- 2. STORAGE RLS POLICIES (storage.objects) — wajib agar upload tidak ditolak
-- ============================================================================

-- avatars: pemilik menulis (path avatars/<uid>/...), publik membaca
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');
drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- community: pemilik menulis, publik membaca
drop policy if exists "community_public_read" on storage.objects;
create policy "community_public_read" on storage.objects
  for select using (bucket_id = 'community');
drop policy if exists "community_owner_insert" on storage.objects;
create policy "community_owner_insert" on storage.objects
  for insert with check (bucket_id = 'community' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "community_owner_update" on storage.objects;
create policy "community_owner_update" on storage.objects
  for update using (bucket_id = 'community' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "community_owner_delete" on storage.objects;
create policy "community_owner_delete" on storage.objects
  for delete using (bucket_id = 'community' and (storage.foldername(name))[1] = auth.uid()::text);

-- projects / products / music / media: publik membaca, admin menulis
drop policy if exists "assets_public_read" on storage.objects;
create policy "assets_public_read" on storage.objects
  for select using (bucket_id in ('projects','products','music','media'));
drop policy if exists "assets_admin_insert" on storage.objects;
create policy "assets_admin_insert" on storage.objects
  for insert with check (bucket_id in ('projects','products','music','media') and app.is_admin());
drop policy if exists "assets_admin_update" on storage.objects;
create policy "assets_admin_update" on storage.objects
  for update using (bucket_id in ('projects','products','music','media') and app.is_admin());
drop policy if exists "assets_admin_delete" on storage.objects;
create policy "assets_admin_delete" on storage.objects
  for delete using (bucket_id in ('projects','products','music','media') and app.is_admin());

-- seller boleh unggah/kelola gambar produk (dari 0010)
drop policy if exists "products_seller_insert" on storage.objects;
create policy "products_seller_insert" on storage.objects
  for insert with check (bucket_id = 'products' and app.is_seller());
drop policy if exists "products_seller_update" on storage.objects;
create policy "products_seller_update" on storage.objects
  for update using (bucket_id = 'products' and app.is_seller());
drop policy if exists "products_seller_delete" on storage.objects;
create policy "products_seller_delete" on storage.objects
  for delete using (bucket_id = 'products' and app.is_seller());

-- ============================================================================
-- 3. ROLE SELLER + HELPER (isi 0009 — idempotent)
-- ============================================================================
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user','moderator','seller','admin'));

drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all" on public.products
  for all using (app.is_staff()) with check (app.is_staff());

drop policy if exists "product_images_admin_all" on public.product_images;
create policy "product_images_admin_all" on public.product_images
  for all using (app.is_staff()) with check (app.is_staff());

drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert" on public.profiles
  for insert with check (app.is_admin());

-- Guard: role/status hanya boleh diubah oleh admin (isi 0010)
create or replace function app.guard_profile_privileged_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.status is distinct from old.status) then
    if not app.is_admin() then
      raise exception 'forbidden_profile_change';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_profile_privileged_change on public.profiles;
create trigger trg_profile_privileged_change
  before update on public.profiles
  for each row execute function app.guard_profile_privileged_change();

-- ============================================================================
-- 4. RPC (definisi asli di schema app + wrapper public untuk API)
--    app.bump_rate_limit (0004), app.adjust_stock (0006), app.create_order (0005)
-- ============================================================================
create or replace function app.bump_rate_limit(
  p_key text,
  p_limit int,
  p_window_seconds int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if p_window_seconds <= 0 or p_limit <= 0 then
    return true;
  end if;
  insert into rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update set
    count = case
      when rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        then 1
      else rate_limits.count + 1
    end,
    window_start = case
      when rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        then now()
      else rate_limits.window_start
    end
  returning count into v_count;
  return coalesce(v_count, 0) <= p_limit;
end;
$$;
grant execute on function app.bump_rate_limit(text, int, int) to service_role;

create or replace function app.adjust_stock(
  p_product_id uuid,
  p_delta integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not app.is_admin() then
    raise exception 'admin_only';
  end if;
  update products
     set stock = greatest(stock + p_delta, 0),
         updated_at = now()
   where id = p_product_id;
end;
$$;
grant execute on function app.adjust_stock(uuid, integer) to authenticated;

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
    v_subtotal, v_subtotal, 'IDR'
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

-- ============================================================================
-- 5. WRAPPER PUBLIC — bisa dipanggil dari API (api.schemas = ["public", ...])
-- ============================================================================
create or replace function public.create_order(
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
begin
  return app.create_order(
    p_customer_name, p_customer_email,
    p_customer_phone, p_customer_address, p_notes
  );
end;
$$;
grant execute on function public.create_order(text, text, text, text, text) to authenticated;

create or replace function public.adjust_stock(
  p_product_id uuid,
  p_delta integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform app.adjust_stock(p_product_id, p_delta);
end;
$$;
grant execute on function public.adjust_stock(uuid, integer) to authenticated;

create or replace function public.bump_rate_limit(
  p_key text,
  p_limit int,
  p_window_seconds int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return app.bump_rate_limit(p_key, p_limit, p_window_seconds);
end;
$$;
grant execute on function public.bump_rate_limit(text, int, int) to service_role;