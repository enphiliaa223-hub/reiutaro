-- ============================================================================
-- REIUTAROU — 0001_initial_schema (FINAL Phase 4)
-- Supabase PostgreSQL (postgres schema default).
-- Dijalankan lewat Supabase SQL Editor / supabase db push.
-- ============================================================================

create extension if not exists pg_trgm;

-- ----------------------------------------------------------------------------
-- App schema helper
-- ----------------------------------------------------------------------------
create schema if not exists app;

-- ============================================================================
-- profiles
-- ============================================================================
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text not null unique,
  display_name  text not null,
  avatar_url    text,
  bio           text,
  role          text not null default 'user'
                  check (role in ('user','moderator','admin')),
  status        text not null default 'active'
                  check (status in ('active','suspended','banned')),
  social_links  jsonb not null default '{}'::jsonb,
  education     jsonb not null default '[]'::jsonb,
  skills        text[] not null default '{}',
  interests     text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index profiles_role_idx on public.profiles(role);

-- helper: apakah actor adalah admin (security definer agar aman di RLS)
create or replace function app.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

-- helper: apakah actor adalah moderator (admin termasuk moderator)
create or replace function app.is_moderator()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'active'
      and role in ('admin','moderator')
  );
$$;

-- otomatis buat profile saat auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'username',''),
      'user_' || substr(new.id::text,1,8)
    ),
    coalesce(new.raw_user_meta_data->>'display_name', (new.raw_user_meta_data->>'username') , 'User'),
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Triggers umum: updated_at + counter (likes/comments)
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- trigger updated_at & counter lainnya dibuat di akhir file (tabel baru ada di sana)

-- counter posts.likes_count (jaga konsisten, hindari penambahan manual yang boleh salah)
create or replace function public.sync_post_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

-- counter posts.comments_count
create or replace function public.sync_comments_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

-- rekalkulasi ulang counter (dipanggil manual setelah backfill)
create or replace function app.recompute_counts()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts p set
    likes_count = (select count(*) from public.post_likes pl where pl.post_id = p.id),
    comments_count = (select count(*) from public.comments c where c.post_id = p.id and c.status = 'published');
end;
$$;

-- ============================================================================
-- categories (forum / community / product)
-- ============================================================================
create table public.categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,
  type          text not null default 'forum'
                  check (type in ('forum','community','product')),
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- posts (community feed + forum threads)
-- ============================================================================
create table public.posts (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references public.profiles(id) on delete cascade,
  category_id     uuid references public.categories(id) on delete set null,
  title           text,
  content         text not null,
  image_url       text,
  status          text not null default 'published'
                    check (status in ('published','hidden','deleted')),
  is_pinned       bool not null default false,
  likes_count     int not null default 0 check (likes_count >= 0),
  comments_count  int not null default 0 check (comments_count >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index posts_author_idx on public.posts(author_id);
create index posts_category_idx on public.posts(category_id);
create index posts_status_idx on public.posts(status);
create index posts_created_idx on public.posts(created_at desc);
create index posts_title_trgm on public.posts using gin (title gin_trgm_ops);

-- ============================================================================
-- comments
-- ============================================================================
create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  parent_id   uuid references public.comments(id) on delete cascade,
  content     text not null,
  status      text not null default 'published'
                check (status in ('published','hidden','deleted')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index comments_post_idx on public.comments(post_id);
create index comments_author_idx on public.comments(author_id);

-- ============================================================================
-- post_likes
-- ============================================================================
create table public.post_likes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  post_id     uuid not null references public.posts(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, post_id)
);

-- ============================================================================
-- reports
-- ============================================================================
create table public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references public.profiles(id) on delete cascade,
  target_type   text not null
                  check (target_type in ('post','comment','user','product')),
  target_id     uuid not null,
  reason        text,
  detail        text,
  status        text not null default 'open'
                  check (status in ('open','reviewing','resolved','dismissed')),
  handled_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index reports_status_idx on public.reports(status);
create index reports_target_idx on public.reports(target_type, target_id);

-- ============================================================================
-- projects
-- ============================================================================
create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  slug          text not null unique,
  category      text,
  description   text,
  body          text,
  technology    text[] not null default '{}',
  github_url    text,
  demo_url      text,
  cover_image   text,
  status        text not null default 'draft'
                  check (status in ('draft','published')),
  featured      bool not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index projects_featured_idx on public.projects(featured) where featured;
create index projects_title_trgm on public.projects using gin (title gin_trgm_ops);

create table public.project_images (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  url         text not null,
  sort_order  int not null default 0
);
create index project_images_project_idx on public.project_images(project_id);

-- ============================================================================
-- products
-- ============================================================================
create table public.products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,
  price         numeric(12,2) not null check (price >= 0),
  stock         int not null default 0 check (stock >= 0),
  type          text not null
                  check (type in ('digital','topup','merchandise','service','other')),
  category_id   uuid references public.categories(id) on delete set null,
  status        text not null default 'active'
                  check (status in ('active','draft','inactive')),
  featured      bool not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index products_status_idx on public.products(status);
create index products_category_idx on public.products(category_id);
create index products_featured_idx on public.products(featured) where featured;
create index products_name_trgm on public.products using gin (name gin_trgm_ops);

create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  url         text not null,
  sort_order  int not null default 0
);
create index product_images_product_idx on public.product_images(product_id);

-- ============================================================================
-- carts & cart_items
-- ============================================================================
create table public.carts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  cart_id     uuid not null references public.carts(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  quantity    int not null check (quantity > 0),
  unique (cart_id, product_id)
);
create index cart_items_cart_idx on public.cart_items(cart_id);

-- ============================================================================
-- orders & order_items
-- ============================================================================
create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  status            text not null default 'pending'
                      check (status in ('pending','awaiting_payment','paid',
                                        'processing','completed','cancelled','refunded')),
  payment_status    text not null default 'pending'
                      check (payment_status in ('pending','paid','failed','refunded')),
  customer_name     text,
  customer_email    text,
  customer_phone    text,
  customer_address  text,
  notes             text,
  subtotal          numeric(12,2) not null default 0 check (subtotal >= 0),
  total             numeric(12,2) not null default 0 check (total >= 0),
  currency          text not null default 'USD',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index orders_user_idx on public.orders(user_id);
create index orders_status_idx on public.orders(status);
create index orders_created_idx on public.orders(created_at desc);

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  product_name  text not null,
  unit_price    numeric(12,2) not null check (unit_price >= 0),
  quantity      int not null check (quantity > 0),
  subtotal      numeric(12,2) not null check (subtotal >= 0)
);
create index order_items_order_idx on public.order_items(order_id);

-- ============================================================================
-- music_tracks
-- ============================================================================
create table public.music_tracks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  artist      text,
  cover_url   text,
  audio_url   text not null,
  duration    int,
  sort_order  int not null default 0,
  active      bool not null default true,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- media
-- ============================================================================
create table public.media (
  id            uuid primary key default gen_random_uuid(),
  type          text not null
                  check (type in ('image','audio','video','other')),
  filename      text not null,
  storage_path  text not null,
  url           text not null,
  mime_type     text,
  size_bytes    bigint,
  bucket        text not null,
  uploaded_by   uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- site_settings
-- ============================================================================
create table public.site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- ============================================================================
-- pages (opsional custom)
-- ============================================================================
create table public.pages (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  content     text not null,
  published   bool not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================================
-- notifications
-- ============================================================================
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null
                check (type in ('comment','like','order','admin','system')),
  title       text not null,
  body        text,
  data        jsonb not null default '{}'::jsonb,
  read        bool not null default false,
  created_at  timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, read);

-- ============================================================================
-- audit_logs
-- ============================================================================
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  target_type text,
  target_id   text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs(created_at desc);
create index audit_logs_actor_idx on public.audit_logs(actor_id);

-- ============================================================================
-- rate_limits (internal, server-side only)
-- ============================================================================
create table public.rate_limits (
  key          text primary key,
  count        int not null default 0,
  window_start timestamptz not null default now()
);

-- ============================================================================
-- RLS: enable + policies lengkap (FINAL)
-- Strategi dua lapis: RLS sebagai boundary utama + server action (service role)
-- untuk operasi admin sensitif. Moderator = admin/moderator role.
-- ============================================================================
create trigger tg_posts_updated_at before update on public.posts
  for each row execute function public.set_updated_at();
create trigger tg_comments_updated_at before update on public.comments
  for each row execute function public.set_updated_at();
create trigger tg_projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger tg_products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger tg_site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();
create trigger tg_pages_updated_at before update on public.pages
  for each row execute function public.set_updated_at();
create trigger tg_orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger tg_post_likes_count after insert or delete on public.post_likes
  for each row execute function public.sync_post_likes_count();
create trigger tg_comments_count after insert or delete on public.comments
  for each row execute function public.sync_comments_count();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.reports enable row level security;
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.music_tracks enable row level security;
alter table public.media enable row level security;
alter table public.site_settings enable row level security;
alter table public.pages enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- ---------------- profiles ----------------
create policy "profiles_public_read" on public.profiles
  for select using (status = 'active');
create policy "profiles_own_read" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_own_update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_read" on public.profiles
  for select using (app.is_admin());
create policy "profiles_admin_update" on public.profiles
  for update using (app.is_admin());

-- ---------------- posts ----------------
create policy "posts_public_read" on public.posts
  for select using (status = 'published');
create policy "posts_owner_insert" on public.posts
  for insert with check (author_id = auth.uid());
create policy "posts_owner_update" on public.posts
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "posts_owner_delete" on public.posts
  for delete using (author_id = auth.uid());
create policy "posts_moderator_read" on public.posts
  for select using (app.is_moderator());
create policy "posts_moderator_update" on public.posts
  for update using (app.is_moderator());
create policy "posts_admin_delete" on public.posts
  for delete using (app.is_admin());

-- ---------------- comments ----------------
create policy "comments_public_read" on public.comments
  for select using (status = 'published');
create policy "comments_owner_insert" on public.comments
  for insert with check (author_id = auth.uid());
create policy "comments_owner_update" on public.comments
  for update using (author_id = auth.uid());
create policy "comments_owner_delete" on public.comments
  for delete using (author_id = auth.uid());
create policy "comments_moderator_read" on public.comments
  for select using (app.is_moderator());
create policy "comments_moderator_update" on public.comments
  for update using (app.is_moderator());
create policy "comments_admin_delete" on public.comments
  for delete using (app.is_admin());

-- ---------------- post_likes ----------------
create policy "likes_public_read" on public.post_likes
  for select using (true);
create policy "likes_owner_insert" on public.post_likes
  for insert with check (user_id = auth.uid());
create policy "likes_owner_delete" on public.post_likes
  for delete using (user_id = auth.uid());

-- ---------------- reports ----------------
create policy "reports_owner_insert" on public.reports
  for insert with check (reporter_id = auth.uid());
create policy "reports_owner_read" on public.reports
  for select using (reporter_id = auth.uid());
create policy "reports_moderator_all" on public.reports
  for all using (app.is_moderator()) with check (app.is_moderator());

-- ---------------- categories ----------------
create policy "categories_public_read" on public.categories
  for select using (true);
create policy "categories_admin_all" on public.categories
  for all using (app.is_admin()) with check (app.is_admin());

-- ---------------- projects ----------------
create policy "projects_public_read" on public.projects
  for select using (status = 'published');
create policy "projects_admin_all" on public.projects
  for all using (app.is_admin()) with check (app.is_admin());

-- ---------------- project_images ----------------
create policy "project_images_public_read" on public.project_images
  for select using (
    exists (select 1 from public.projects p where p.id = project_id and p.status = 'published')
  );
create policy "project_images_admin_all" on public.project_images
  for all using (app.is_admin()) with check (app.is_admin());

-- ---------------- products ----------------
create policy "products_public_read" on public.products
  for select using (status = 'active');
create policy "products_admin_all" on public.products
  for all using (app.is_admin()) with check (app.is_admin());

-- ---------------- product_images ----------------
create policy "product_images_public_read" on public.product_images
  for select using (
    exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
  );
create policy "product_images_admin_all" on public.product_images
  for all using (app.is_admin()) with check (app.is_admin());

-- ---------------- carts / cart_items ----------------
create policy "cart_owner_all" on public.carts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "cart_items_owner_all" on public.cart_items
  for all using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  );

-- ---------------- orders / order_items ----------------
create policy "orders_owner_read" on public.orders
  for select using (user_id = auth.uid());
create policy "orders_admin_select" on public.orders
  for select using (app.is_admin());
create policy "orders_admin_update" on public.orders
  for update using (app.is_admin());
create policy "order_items_owner_read" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "order_items_admin_read" on public.order_items
  for select using (app.is_admin());

-- ---------------- music_tracks ----------------
create policy "music_public_read" on public.music_tracks
  for select using (active = true);
create policy "music_admin_all" on public.music_tracks
  for all using (app.is_admin()) with check (app.is_admin());

-- ---------------- media ----------------
create policy "media_public_read" on public.media
  for select using (true);
create policy "media_owner_all" on public.media
  for all using (uploaded_by = auth.uid()) with check (uploaded_by = auth.uid());
create policy "media_admin_all" on public.media
  for all using (app.is_admin()) with check (app.is_admin());

-- ---------------- site_settings ----------------
create policy "site_settings_public_read" on public.site_settings
  for select using (true);
create policy "site_settings_admin_all" on public.site_settings
  for all using (app.is_admin()) with check (app.is_admin());

-- ---------------- pages ----------------
create policy "pages_public_read" on public.pages
  for select using (published = true);
create policy "pages_admin_all" on public.pages
  for all using (app.is_admin()) with check (app.is_admin());

-- ---------------- notifications ----------------
create policy "notifications_owner_all" on public.notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------- audit_logs ----------------
create policy "audit_logs_admin_read" on public.audit_logs
  for select using (app.is_admin());

-- ============================================================================
-- Seed dasar (kategori forum default) — role admin dibuat manual di dashboard
-- ============================================================================
insert into public.categories (name, slug, type) values
  ('Anime','anime','forum'),
  ('Manga','manga','forum'),
  ('Games','games','forum'),
  ('Japanese Culture','japanese-culture','forum'),
  ('Technology','technology','forum'),
  ('General','general','forum'),
  ('Other','other','forum')
on conflict (slug) do nothing;