-- ============================================================================
-- REIUTAROU — 0002_seed_and_storage (FINAL Phase 4)
-- Seed konten awal + Storage buckets & policies.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Seed: kategori produk (byte-short list yang dipakai admin/visual editor)
-- ----------------------------------------------------------------------------
insert into public.categories (name, slug, type) values
  ('Digital Product', 'digital', 'product'),
  ('Game / Top Up',   'game-top-up', 'product'),
  ('Merchandise',     'merchandise', 'product'),
  ('Service',         'service', 'product'),
  ('Other',           'other-products', 'product')
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- Seed: site_settings default (Phase 10 Visual Editor membaca tabel ini)
-- ----------------------------------------------------------------------------
insert into public.site_settings (key, value) values
  ('brand',                    '"REIUTAROU"'),
  ('owner_name',               '"Muhammad Reinaldi"'),
  ('hero_kicker',              '"PERSONAL DIGITAL UNIVERSE"'),
  ('hero_tagline',             '"Welcome to my digital universe."'),
  ('hero_description',         '"Anime-inspired community, projects, store, and music — crafted by Muhammad Reinaldi."'),
  ('opening_enabled',          'true'::jsonb),
  ('opening_duration',         '4600'::jsonb),
  ('opening_title',            '"REIUTAROU"'),
  ('opening_subtitle',         '"YOUR DIGITAL WORLD"'),
  ('opening_show_skip',        'true'::jsonb),
  ('about_bio',                '"Creating digital worlds inspired by anime and game UX."'),
  ('footer_socials',           '[{"label":"GitHub","url":""},{"label":"X","url":""},{"label":"Instagram","url":""}]'),
  ('maintenance_mode',         'false'::jsonb)
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- Storage: buckets (semua public untuk V1; file yang sensitif tidak di-host di sini)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',   'avatars',   true, 5242880,  array['image/png','image/jpeg','image/webp']),
  ('community', 'community', true, 10485760, array['image/png','image/jpeg','image/webp','image/gif']),
  ('projects',  'projects',  true, 10485760, array['image/png','image/jpeg','image/webp']),
  ('products',  'products',  true, 10485760, array['image/png','image/jpeg','image/webp']),
  ('music',     'music',     true, 26214400, array['audio/mpeg','audio/ogg','audio/mp4','audio/webm']),
  ('media',     'media',     true, 10485760, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- Storage policies (storage.objects)
-- Pola path: <bucket>/<user_id>/<timestamp>-<uuid>.<ext> untuk upload owner
-- ----------------------------------------------------------------------------

-- avatars: owner write (path: avatars/<uid>/...), public read
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatars_owner_insert" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_owner_update" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_owner_delete" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- community: owner write, public read
create policy "community_public_read" on storage.objects
  for select using (bucket_id = 'community');
create policy "community_owner_insert" on storage.objects
  for insert with check (bucket_id = 'community' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "community_owner_update" on storage.objects
  for update using (bucket_id = 'community' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "community_owner_delete" on storage.objects
  for delete using (bucket_id = 'community' and (storage.foldername(name))[1] = auth.uid()::text);

-- projects / products / music / media: public read, admin write
create policy "assets_public_read" on storage.objects
  for select using (bucket_id in ('projects','products','music','media'));
create policy "assets_admin_insert" on storage.objects
  for insert with check (bucket_id in ('projects','products','music','media') and app.is_admin());
create policy "assets_admin_update" on storage.objects
  for update using (bucket_id in ('projects','products','music','media') and app.is_admin());
create policy "assets_admin_delete" on storage.objects
  for delete using (bucket_id in ('projects','products','music','media') and app.is_admin());