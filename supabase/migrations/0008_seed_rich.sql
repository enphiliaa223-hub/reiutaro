-- ============================================================================
-- REIUTAROU — 0008_seed_rich (Phase 15)
-- Konten demonya diperkaya. Semua insert idempotent (ON CONFLICT DO NOTHING /
-- not exists), boleh dijalankan kapan pun tanpa merusak data yang sudah ada.
-- Produk/proyek hanya di-seed bila sudah ada admin aktif (mengikuti pola 0003).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Proyek tambahan (2)
-- ----------------------------------------------------------------------------
insert into public.projects
  (title, slug, category, description, body, technology, github_url, demo_url, status, featured, sort_order)
select
  'Tokusatsu Fanart Gallery', 'tokusatsu-fanart-gallery', 'Art',
  'Galeri fanart bertema tokusatsu & anime — warna tebal, aksi penuh gerak.',
  'Konten demo — detail diunggah via Admin (bucket `projects`).',
  array['Illustration','Figma'], 'https://github.com/', null,
  'published', false, 4
where exists (select 1 from public.profiles where role = 'admin' and status = 'active')
  and not exists (select 1 from public.projects where slug = 'tokusatsu-fanart-gallery');

insert into public.projects
  (title, slug, category, description, body, technology, github_url, demo_url, status, featured, sort_order)
select
  'Open Source Utils Library', 'open-source-utils-library', 'Tools',
  'Koleksi util kecil (rate-limit, slug, validasi) yang dipakai situs ini, dirilis sebagai paket.',
  'Konten demo — detail diunggah via Admin.',
  array['TypeScript','Vitest','npm'], 'https://github.com/', 'https://npmjs.com',
  'published', false, 5
where exists (select 1 from public.profiles where role = 'admin' and status = 'active')
  and not exists (select 1 from public.projects where slug = 'open-source-utils-library');

-- ----------------------------------------------------------------------------
-- Produk tambahan (4)
-- ----------------------------------------------------------------------------
insert into public.products (name, slug, description, price, stock, type, category_id, status, featured)
select 'Animated Sticker Pack', 'animated-sticker-pack',
       'Stiker animasi (Lottie) untuk Discord/WhatsApp: 40 stiker bertema Reiuta.', 5.00, 100, 'digital',
       c.id, 'active', false
from public.profiles p
cross join public.categories c
where p.role = 'admin' and p.status = 'active' and c.slug = 'digital'
  and not exists (select 1 from public.products where slug = 'animated-sticker-pack');

insert into public.products (name, slug, description, price, stock, type, category_id, status, featured)
select 'Lo-fi Color Presets', 'lofi-color-presets',
       'Preset warna lightroom/CAPCUT bernuansa lo-fi & anime film grain.', 9.00, 200, 'digital',
       c.id, 'active', false
from public.profiles p
cross join public.categories c
where p.role = 'admin' and p.status = 'active' and c.slug = 'digital'
  and not exists (select 1 from public.products where slug = 'lofi-color-presets');

insert into public.products (name, slug, description, price, stock, type, category_id, status, featured)
select 'Poster Set — Shonen Aesthetic', 'poster-set-shonen',
       'Set 3 poster A3 hasil ilustrasi sendiri bertema shonen aesthetic.', 18.00, 25, 'merchandise',
       c.id, 'active', false
from public.profiles p
cross join public.categories c
where p.role = 'admin' and p.status = 'active' and c.slug = 'merchandise'
  and not exists (select 1 from public.products where slug = 'poster-set-shonen');

insert into public.products (name, slug, description, price, stock, type, category_id, status, featured)
select '1-on-1 Mentorship Web Dev', 'mentorship-web-dev',
       'Sesi mentoring 60 menit: Next.js perancah (scaffold), arsitektur, dan karier.', 80.00, 5, 'service',
       c.id, 'active', false
from public.profiles p
cross join public.categories c
where p.role = 'admin' and p.status = 'active' and c.slug = 'service'
  and not exists (select 1 from public.products where slug = 'mentorship-web-dev');

-- ----------------------------------------------------------------------------
-- Track musik tambahan (inactive; audio diunggah via Admin)
-- ----------------------------------------------------------------------------
insert into public.music_tracks (title, artist, audio_url, duration, sort_order, active) values
  ('Cloud Nine',      'Reiutarou', '', 188, 5, false),
  ('Sunday Loops',    'Reiutarou', '', 236, 6, false),
  ('Winter Lights',   'Reiutarou', '', 174, 7, false),
  ('Sakura Drift',    'Reiutarou', '', 202, 8, false)
on conflict do nothing;