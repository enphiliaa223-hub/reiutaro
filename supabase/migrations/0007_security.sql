-- 0007_security.sql
-- Phase 11 — Security hardening:
-- carts tidak punya policy RLS (padahal RLS enable) → tambahkan policy owner.
-- Tanpa ini ensureCart (insert carts) akan 403.
-- (Guard stok sudah ditangani app.create_order di 0005: quantity > stock → E_STOCK.)

create policy "carts_owner_select" on public.carts
  for select using (auth.uid() = user_id);

create policy "carts_owner_insert" on public.carts
  for insert with check (auth.uid() = user_id);

create policy "carts_owner_update" on public.carts
  for update using (auth.uid() = user_id);

create policy "carts_owner_delete" on public.carts
  for delete using (auth.uid() = user_id);