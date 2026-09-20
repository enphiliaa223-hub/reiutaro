# REIUTAROU — Database Design (Supabase/PostgreSQL)

Dokumen ini hasil Phase 1. Migrasi SQL final direview & dijalankan di **Phase 4** (draft awal: `supabase/migrations/0001_initial_schema.sql`).

---

## 1. Entity Relationship (Ringkasan)

```
auth.users ──1:1── profiles ──1:N── posts ──1:N── comments
                           │            └─1:N── post_likes
                           │
           posts ──N:1── categories (type forum/community/product)
                           │
auth.users ──1:N── products.order... (via order_items)
profiles ──1:1── carts ──1:N── cart_items ──N:1── products
profiles ──1:N── orders ──1:N── order_items ──N:1── products
profiles ──1:N── reports (reporter / handled_by)
profiles ──1:N── projects ──1:N── project_images
profiles ──1:N── products ──1:N── product_images
profiles ──1:N── media
music_tracks (standalone, admin)
site_settings (key/value)
notifications (per user)
audit_logs (per actor)
rate_limits (non-akun internal)
```

---

## 2. Tabel & Kolom

### profiles

| kolom                   | tipe                  | ket                                     |
| ----------------------- | --------------------- | --------------------------------------- |
| id                      | uuid PK               | = auth.users.id, FK cascade             |
| username                | text unique not null  | lowercase, diautokaname slug            |
| display_name            | text not null         |                                         |
| avatar_url              | text                  | storage path                            |
| bio                     | text                  |                                         |
| role                    | text default 'user'   | check ('user','moderator','admin')      |
| status                  | text default 'active' | check ('active','suspended','banned')   |
| social_links            | jsonb default '{}'    | github/x/x/ig                           |
| education               | jsonb                 | `[{ title, place, year }]` (about page) |
| skills                  | text[]                |                                         |
| interests               | text[]                |                                         |
| created_at / updated_at | timestamptz           |                                         |

### categories

| kolom       | tipe                 | ket                                   |
| ----------- | -------------------- | ------------------------------------- |
| id          | uuid PK              |                                       |
| name        | text not null        |                                       |
| slug        | text unique not null |                                       |
| description | text                 |                                       |
| type        | text default 'forum' | check ('forum','community','product') |
| sort_order  | int default 0        |                                       |
| created_at  | timestamptz          |                                       |

### posts (community feed + forum threads)

| kolom                        | tipe                      | ket                                    |
| ---------------------------- | ------------------------- | -------------------------------------- |
| id                           | uuid PK                   |                                        |
| author_id                    | uuid FK profiles not null |                                        |
| category_id                  | uuid FK categories        | nullable                               |
| title                        | text                      | nullable utk community singkat         |
| content                      | text not null             | plain text + sanitized                 |
| image_url                    | text                      |                                        |
| status                       | text default 'published'  | check ('published','hidden','deleted') |
| is_pinned                    | bool default false        |                                        |
| likes_count / comments_count | int default 0             | maintain via counter/tambah            |
| created_at / updated_at      | timestamptz               |                                        |

### comments

| kolom                   | tipe                      | ket                                    |
| ----------------------- | ------------------------- | -------------------------------------- |
| id                      | uuid PK                   |                                        |
| post_id                 | uuid FK posts not null    |                                        |
| author_id               | uuid FK profiles not null |                                        |
| parent_id               | uuid FK comments          | nullable (V2 reply)                    |
| content                 | text not null             | sanitized                              |
| status                  | text default 'published'  | check ('published','hidden','deleted') |
| created_at / updated_at | timestamptz               |                                        |

### post_likes

| kolom                        | tipe                      | ket               |
| ---------------------------- | ------------------------- | ----------------- |
| id                           | uuid PK                   |                   |
| user_id                      | uuid FK profiles not null |                   |
| post_id                      | uuid FK posts not null    |                   |
| created_at                   | timestamptz               |                   |
| **unique(user_id, post_id)** |                           | cegah double like |

### reports

| kolom                   | tipe                | ket                                               |
| ----------------------- | ------------------- | ------------------------------------------------- |
| id                      | uuid PK             |                                                   |
| reporter_id             | uuid FK profiles    |                                                   |
| target_type             | text not null       | check ('post','comment','user','product')         |
| target_id               | uuid not null       |                                                   |
| reason                  | text                |                                                   |
| detail                  | text                |                                                   |
| status                  | text default 'open' | check ('open','reviewing','resolved','dismissed') |
| handled_by              | uuid FK profiles    |                                                   |
| created_at / updated_at | timestamptz         |                                                   |

### projects

| kolom                   | tipe                     | ket                           |
| ----------------------- | ------------------------ | ----------------------------- |
| id                      | uuid PK                  |                               |
| title                   | text not null            |                               |
| slug                    | text unique not null     |                               |
| category                | text                     |                               |
| description             | text                     | short                         |
| body                    | text                     | long, sanitized markdown-lite |
| technology              | text[]                   |                               |
| github_url / demo_url   | text                     | validasi URL                  |
| cover_image             | text                     |                               |
| status                  | text default 'published' | check ('draft','published')   |
| featured                | bool default false       |                               |
| sort_order              | int default 0            |                               |
| created_at / updated_at | timestamptz              |                               |

### project_images

| kolom      | tipe                      | ket     |
| ---------- | ------------------------- | ------- |
| id         | uuid PK                   |         |
| project_id | uuid FK projects not null | cascade |
| url        | text not null             |         |
| sort_order | int default 0             |         |

### products

| kolom                   | tipe                   | ket                                                       |
| ----------------------- | ---------------------- | --------------------------------------------------------- |
| id                      | uuid PK                |                                                           |
| name                    | text not null          |                                                           |
| slug                    | text unique not null   |                                                           |
| description             | text                   | sanitized                                                 |
| price                   | numeric(12,2) not null | check (price >= 0)                                        |
| stock                   | int not null default 0 | check (stock >= 0)                                        |
| type                    | text not null          | check ('digital','topup','merchandise','service','other') |
| category_id             | uuid FK categories     | type='product'                                            |
| status                  | text default 'active'  | check ('active','draft','inactive')                       |
| featured                | bool default false     |                                                           |
| created_at / updated_at | timestamptz            |                                                           |

### product_images

| kolom      | tipe                      | ket     |
| ---------- | ------------------------- | ------- |
| id         | uuid PK                   |         |
| product_id | uuid FK products not null | cascade |
| url        | text not null             |         |
| sort_order | int default 0             |         |

### carts

| kolom                   | tipe                             | ket            |
| ----------------------- | -------------------------------- | -------------- |
| id                      | uuid PK                          |                |
| user_id                 | uuid FK profiles not null unique | satu cart/user |
| created_at / updated_at | timestamptz                      |                |

### cart_items

| kolom                           | tipe                      | ket                  |
| ------------------------------- | ------------------------- | -------------------- |
| id                              | uuid PK                   |                      |
| cart_id                         | uuid FK carts not null    | cascade              |
| product_id                      | uuid FK products not null |                      |
| quantity                        | int not null              | check (quantity > 0) |
| **unique(cart_id, product_id)** |                           |                      |

### orders

| kolom                                                                      | tipe                      | ket                                                                                         |
| -------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| id                                                                         | uuid PK                   |                                                                                             |
| order_number                                                               | text unique not null      | e.g. `RT-XXXXXX`                                                                            |
| user_id                                                                    | uuid FK profiles not null |                                                                                             |
| status                                                                     | text default 'pending'    | check ('pending','awaiting_payment','paid','processing','completed','cancelled','refunded') |
| payment_status                                                             | text default 'pending'    | check ('pending','paid','failed','refunded')                                                |
| customer_name / customer_email / customer_phone / customer_address / notes | text                      | snapshot info                                                                               |
| subtotal                                                                   | numeric(12,2)             | server-side calc                                                                            |
| total                                                                      | numeric(12,2)             | server-side calc                                                                            |
| currency                                                                   | text default 'USD'        |                                                                                             |
| created_at / updated_at                                                    | timestamptz               |                                                                                             |

### order_items

| kolom        | tipe                    | ket                             |
| ------------ | ----------------------- | ------------------------------- |
| id           | uuid PK                 |                                 |
| order_id     | uuid FK orders not null | cascade                         |
| product_id   | uuid FK products        | nullable (produk dihapus)       |
| product_name | text not null           | **snapshot**                    |
| unit_price   | numeric(12,2) not null  | **snapshot dari DB saat order** |
| quantity     | int not null            | check > 0                       |
| subtotal     | numeric(12,2)           | server-side                     |

### music_tracks

| kolom      | tipe              | ket          |
| ---------- | ----------------- | ------------ |
| id         | uuid PK           |              |
| title      | text not null     |              |
| artist     | text              |              |
| cover_url  | text              |              |
| audio_url  | text not null     | storage path |
| duration   | int               | seconds      |
| sort_order | int default 0     |              |
| active     | bool default true |              |
| created_at | timestamptz       |              |

### media

| kolom        | tipe             | ket                                     |
| ------------ | ---------------- | --------------------------------------- |
| id           | uuid PK          |                                         |
| type         | text not null    | check ('image','audio','video','other') |
| filename     | text             | aslinya                                 |
| storage_path | text not null    | generated safe path                     |
| url          | text not null    |                                         |
| mime_type    | text             |                                         |
| size_bytes   | bigint           |                                         |
| bucket       | text             |                                         |
| uploaded_by  | uuid FK profiles |                                         |
| created_at   | timestamptz      |                                         |

### site_settings

| kolom      | tipe           | ket                                                   |
| ---------- | -------------- | ----------------------------------------------------- |
| key        | text PK        | `hero_title`, `opening_enabled`, `opening_title`, ... |
| value      | jsonb not null |                                                       |
| updated_at | timestamptz    |                                                       |

### pages (custom, opsional)

| kolom                   | tipe               | ket       |
| ----------------------- | ------------------ | --------- |
| id                      | uuid PK            |           |
| slug                    | text unique        |           |
| title                   | text               |           |
| content                 | text               | sanitized |
| published               | bool default false |           |
| created_at / updated_at | timestamptz        |           |

### notifications

| kolom        | tipe                      | ket                                               |
| ------------ | ------------------------- | ------------------------------------------------- |
| id           | uuid PK                   |                                                   |
| user_id      | uuid FK profiles not null |                                                   |
| type         | text not null             | check ('comment','like','order','admin','system') |
| title / body | text                      |                                                   |
| data         | jsonb                     |                                                   |
| read         | bool default false        |                                                   |
| created_at   | timestamptz               |                                                   |

### audit_logs

| kolom       | tipe             | ket                                       |
| ----------- | ---------------- | ----------------------------------------- |
| id          | uuid PK          |                                           |
| actor_id    | uuid FK profiles |                                           |
| action      | text not null    | e.g. `delete_user`, `update_order_status` |
| target_type | text             |                                           |
| target_id   | text             |                                           |
| metadata    | jsonb            |                                           |
| created_at  | timestamptz      |                                           |

### rate_limits (internal, non ekspos)

| kolom                                                      | tipe        | ket                                  |
| ---------------------------------------------------------- | ----------- | ------------------------------------ |
| key                                                        | text PK     | `login:user@x`, `report:userid`, ... |
| count                                                      | int         |                                      |
| window_start                                               | timestamptz |                                      |
| Notes: token bucket sederhana; diproses server-side hanya. |

---

## 3. Index

Wajib:

- `posts(author_id)`, `posts(category_id)`, `posts(created_at desc)`, `posts(status)`
- `comments(post_id)`, `comments(author_id)`
- `post_likes` unique(user_id, post_id) (otomatis index)
- `cart_items(cart_id)`
- `orders(user_id)`, `orders(status)`, `orders(created_at desc)`
- `order_items(order_id)`
- `products(slug)` unik, `products(status)`, `products(category_id)`, `products(featured)`
- `profiles(username)` unik, `profiles(role)`
- `reports(status)`, `reports(target_type, target_id)`
- `notifications(user_id, read)`
- `audit_logs(created_at desc)`, `audit_logs(actor_id)`
- Search: `pg_trgm` GIN di `posts(title)`, `products(name)`, `projects(title)` bila performa butuh.

---

## 4. RLS Strategy per Tabel

Aturan umum: **select publik dibuka untuk konten berstatus publish; write hanya owner atau admin (service role server-side).** Semua tabel `enable row level security` kecuali yang khusus internal.

| Tabel         | Select                    | Insert                       | Update                   | Delete                   |
| ------------- | ------------------------- | ---------------------------- | ------------------------ | ------------------------ |
| profiles      | semua user (publik)       | via trigger (default)        | owner saja               | none                     |
| posts         | status='published'        | owner (auth.uid()=author_id) | owner                    | owner; admin via service |
| comments      | status='published'        | owner                        | owner                    | owner; admin via service |
| post_likes    | publik (count)            | owner (user_id=uid)          | none                     | owner                    |
| reports       | owner (reporter sendiri)  | owner                        | none (admin via service) | none                     |
| categories    | publik                    | admin service                | admin service            | admin service            |
| projects      | status='published'        | admin                        | admin                    | admin                    |
| products      | status='active' (+stock)  | admin                        | admin                    | admin                    |
| cart_items    | owner (cart miliknya)     | owner                        | owner                    | owner                    |
| orders        | owner (user_id=uid)       | system/service               | none                     | none                     |
| order_items   | owner (via order          | system                       | none                     | none                     |
| music_tracks  | active=true               | admin                        | admin                    | admin                    |
| media         | publik untuk yang dipakai | owner/admin                  | owner/admin              | owner/admin              |
| site_settings | publik (read-only value)  | admin                        | admin                    | admin                    |
| pages         | published                 | admin                        | admin                    | admin                    |
| notifications | owner (user_id=uid)       | system                       | owner (mark read)        | owner                    |
| audit_logs    | admin                     | system                       | none                     | none                     |
| rate_limits   | none (server only)        | server                       | server                   | server                   |

Helper security-definer (dibuat di Phase 4):

```sql
create or replace function app.is_admin() returns boolean ...
  -- cek profiles.role='admin' utk auth.uid()
```

**Penting:** admin write terdpa pergi via `server` (service role) + audit log. Admin **tidak** pakai RLS bypass anon di client.

---

## 5. Storage Strategy

Buckets (semua di Supabase Storage, policy per bucket):

| Bucket      | Isi              | Akses read     | Akses write                                            |
| ----------- | ---------------- | -------------- | ------------------------------------------------------ |
| `avatars`   | foto profil      | publik         | owner `(storage.foldername(name))[1]=auth.uid()::text` |
| `community` | gambar post      | publik         | owner                                                  |
| `projects`  | gambar project   | publik         | admin                                                  |
| `products`  | gambar produk    | publik         | admin                                                  |
| `music`     | audio + cover    | publik (audio) | admin                                                  |
| `media`     | asset admin umum | publik         | admin                                                  |

Aturan:

- filename asli tidak dipakai: `generate safe path` → `bucket/userid/timestamp-uuid.ext`.
- Validasi MIME (bukan cuma extension), size limit (mis. image ≤5MB, audio ≤20MB).
- File non-executable: cek magic byte + MIME; ekstensi whitelist (png/webp/jpg/webm... mp3/webm/m4a ogg).
- URL disimpan di tabel `media` utk audit & reuse.
