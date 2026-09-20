-- ============================================================================
-- REIUTAROU — 0003_seed_content (FINALE Phase 6)
-- Contoh konten yang MENINGKAT ke akun admin pertama.
-- Serta data aktif hanya jika ada admin (best-effort) sehingga migrate
-- sebelum register tidak error. Hambatan: tanpa file aktual di storage,
-- cover empty → komponen pakai placeholder.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- About: setting tambahan (Visual Editor Phase 10)
-- ----------------------------------------------------------------------------
insert into public.site_settings (key, value) values
  ('about_kicker',  '"About"'),
  ('about_intro',   '"Digital universe personal — code, design, anime community, store, dan musik dalam satu atap."'),
  ('about_focus',   '["Code","Design","Community","Music","Anime"]')
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- Projects — hanya jika akun admin sudah aktif
-- ----------------------------------------------------------------------------
insert into public.projects
  (title, slug, category, description, body, technology, github_url, demo_url, status, featured, sort_order)
select
  'Digital Universe — Reiutarou', 'digital-universe', 'Website',
  'Situs personal flagship: arsitektur secure-by-default, admin panel, dan visual system yang konsisten.',
  'Catatan: ini konten demo yang datanya nanti dikelola lewat Admin (Phase 9). Gambar cover diunggah via Project Manager ke bucket `projects`.',
  array['Next.js','Supabase','Tailwind CSS','Motion'], 'https://github.com/', 'https://reiutaro.com',
  'published', true, 1
where exists (select 1 from public.profiles where role = 'admin' and status = 'active');

insert into public.projects
  (title, slug, category, description, body, technology, github_url, demo_url, status, featured, sort_order)
select
  'Anime Community Hub', 'anime-community-hub', 'Community',
  'Wadah diskusi komunitas anime: thread, likes, comments, dan moderasi.',
  'Konten demo — detail diunggah via Admin.',
  array['Next.js','PostgreSQL','RLS'], 'https://github.com/', null,
  'published', true, 2
where exists (select 1 from public.profiles where role = 'admin' and status = 'active');

insert into public.projects
  (title, slug, category, description, body, technology, github_url, demo_url, status, featured, sort_order)
select
  'Music & Ambience', 'music-ambience', 'Music',
  'Player musik ambient untuk menemani bekerja dan belajar.',
  'Konten demo — track diunggah via Admin pada Phase 9.',
  array['TypeScript','Web Audio API'], 'https://github.com/', null,
  'published', false, 3
where exists (select 1 from public.profiles where role = 'admin' and status = 'active');

-- ----------------------------------------------------------------------------
-- Community posts (penulis = admin, tanpa kategori)
-- ----------------------------------------------------------------------------
insert into public.posts (author_id, title, content, status)
select p.id, 'Selamat datang di Reiutaro Community', 'Halo semua! Ini thread pertama di komunitas. Bahas anime, karya, dan apa pun yang sedang kamu buat. Salam hangat!', 'published'
from public.profiles p
where p.role = 'admin' and p.status = 'active'
  and not exists (select 1 from public.posts where title = 'Selamat datang di Reiutaro Community');

insert into public.posts (author_id, title, content, status)
select p.id, 'Apa yang sedang kamu tonton?', 'Drop rekomendasi anime terbaikmu sepanjang musim ini. Boleh disertai alasan singkat — biar seru.', 'published'
from public.profiles p
where p.role = 'admin' and p.status = 'active'
  and not exists (select 1 from public.posts where title = 'Apa yang sedang kamu tonton?');

-- ----------------------------------------------------------------------------
-- Products (aktif hanya jika admin ada; referensi kategori oleh slug)
-- ----------------------------------------------------------------------------
insert into public.products (name, slug, description, price, stock, type, category_id, status, featured)
select 'Wallpaper Pack — Neon Grid', 'wallpaper-pack-neon-grid',
       'Kumpulan wallpaper 4K bertema neon grid khas Reiutarou.', 7.00, 50, 'digital',
       c.id, 'active', true
from public.profiles p
cross join public.categories c
where p.role = 'admin' and p.status = 'active' and c.slug = 'digital'
  and not exists (select 1 from public.products where slug = 'wallpaper-pack-neon-grid');

insert into public.products (name, slug, description, price, stock, type, category_id, status, featured)
select 'Keycap Set — Reiutarou', 'keycap-set-reiutarou',
       'Keycap custom dengan aksen gold khas brand.', 45.00, 10, 'merchandise',
       c.id, 'active', false
from public.profiles p
cross join public.categories c
where p.role = 'admin' and p.status = 'active' and c.slug = 'merchandise'
  and not exists (select 1 from public.products where slug = 'keycap-set-reiutarou');

insert into public.products (name, slug, description, price, stock, type, category_id, status, featured)
select 'Custom Web Design', 'custom-web-design',
       'Jasa desain website personal/portfolio dengan pendekatan UI animasi.', 150.00, 3, 'service',
       c.id, 'active', false
from public.profiles p
cross join public.categories c
where p.role = 'admin' and p.status = 'active' and c.slug = 'service'
  and not exists (select 1 from public.products where slug = 'custom-web-design');

-- ----------------------------------------------------------------------------
-- Music tracks (inactive: audio diunggah via Admin Phase 9 → set active=true)
-- ----------------------------------------------------------------------------
insert into public.music_tracks (title, artist, audio_url, duration, sort_order, active) values
  ('Midnight Grid', 'Reiutarou', '', 210, 1, false),
  ('Rainy Street',  'Reiutarou', '', 180, 2, false),
  ('Neon Dawn',     'Reiutarou', '', 195, 3, false),
  ('After Hours',   'Reiutarou', '', 240, 4, false)
on conflict do nothing;