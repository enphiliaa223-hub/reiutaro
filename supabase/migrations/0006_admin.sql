-- ============================================================================
-- REIUTAROU — 0006_admin (Phase 9)
-- RPC util untuk admin panel: penyesuaian stok tanpa drop di bawah 0.
-- security definer khusus admin; grant hanya ke authenticated + guard is_admin.
-- ============================================================================

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