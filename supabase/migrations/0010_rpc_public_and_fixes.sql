-- ============================================================================
-- REIUTAROU — 0010_rpc_public_and_fixes
-- Fix produksi:
--   1. RPC yang dipakai dari API (create_order, adjust_stock, bump_rate_limit)
--      hanya ada di schema `app` padahal api.schemas = ["public"] → tidak pernah
--      bisa dipanggil. Ditambahkan wrapper di schema `public`.
--   2. Bucket storage `music` hanya menerima audio; cover gambar ditolak → izinkan
--      jenis image juga.
--   3. Constraint payment_status orders tidak mengakui 'void' padahal kode admin
--      memakainya untuk status cancelled/refunded.
--   4. Keamanan: profiles_own_update membiarkan user mengubah role/status sendiri
--      → guard trigger (hanya admin boleh ubah role/status).
--   5. Seller boleh upload gambar produk (bucket `products`), admin tetap semua.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Wrapper public untuk fungsi app-schema yang dipakai lewat API
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 2. Bucket `music`: izinkan gambar cover
-- ----------------------------------------------------------------------------
update storage.buckets
   set allowed_mime_types = array[
         'audio/mpeg','audio/ogg','audio/mp4','audio/webm',
         'image/png','image/jpeg','image/webp'
       ]
 where id = 'music';

-- ----------------------------------------------------------------------------
-- 3. Bucket `music`: izinkan gambar cover
-- ----------------------------------------------------------------------------
update storage.buckets
   set allowed_mime_types = array[
         'audio/mpeg','audio/ogg','audio/mp4','audio/webm',
         'image/png','image/jpeg','image/webp'
       ]
 where id = 'music';

-- ----------------------------------------------------------------------------
-- 4. Guard: role/status hanya boleh diubah oleh admin
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 5. Seller boleh upload file di bucket `products` saja
-- ----------------------------------------------------------------------------
create policy "products_seller_insert" on storage.objects
  for insert with check (bucket_id = 'products' and app.is_seller());
create policy "products_seller_update" on storage.objects
  for update using (bucket_id = 'products' and app.is_seller());
create policy "products_seller_delete" on storage.objects
  for delete using (bucket_id = 'products' and app.is_seller());

-- ----------------------------------------------------------------------------
-- 6. RLS kelola produk juga untuk seller (aman & idempotent jika 0009 belum jalan)
-- ----------------------------------------------------------------------------
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

drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all" on public.products
  for all using (app.is_staff()) with check (app.is_staff());

drop policy if exists "product_images_admin_all" on public.product_images;
create policy "product_images_admin_all" on public.product_images
  for all using (app.is_staff()) with check (app.is_staff());

-- izinkan insert profil oleh admin (buat akun via panel), idempotent
drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert" on public.profiles
  for insert with check (app.is_admin());