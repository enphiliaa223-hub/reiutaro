-- ============================================================================
-- REIUTAROU — 0009_admin_users
-- Role seller (staff produk), helper is_seller/is_staff, RLS produk dibuka
-- untuk staff, dan basis kelola akun (status active/suspended/banned).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Role baru: 'seller'
-- ---------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user','moderator','seller','admin'));

-- ---------------------------------------------------------------------------
-- 2. Helper role
-- ---------------------------------------------------------------------------
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

-- admin ATAU seller (status aktif) — hak kelola produk.
create or replace function app.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select app.is_admin() or app.is_seller();
$$;

-- ---------------------------------------------------------------------------
-- 3. RLS: kelola produk dibuka untuk staff (admin + seller)
-- ---------------------------------------------------------------------------
drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all" on public.products
  for all using (app.is_staff()) with check (app.is_staff());

drop policy if exists "product_images_admin_all" on public.product_images;
create policy "product_images_admin_all" on public.product_images
  for all using (app.is_staff()) with check (app.is_staff());

-- ---------------------------------------------------------------------------
-- 4. RLS tambahan untuk kelola akun (admin): profiles sudah punya
--    profiles_admin_read/update; tambahkan insert untuk pembuatan akun seller.
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert" on public.profiles
  for insert with check (app.is_admin());