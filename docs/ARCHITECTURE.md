# REIUTAROU — Arsitektur

Dokumen ini adalah hasil **Phase 1 (Architecture)** berdasarkan master prompt.
Referensi identitas: brand **REIUTAROU**, pemilik **Muhammad Reinaldi**.

---

## 1. Ringkasan Eksekutif

REIUTAROU = personal digital universe: personal website + portfolio + anime community + store + music player + admin panel.

Prioritas: **Security > Data integrity > Functionality > Maintainability > Performance > UI/UX > Visual effects**.

Prinsip V1: **simple + secure + maintainable + cheap**. Tidak ada microservices, Redis, Kafka, VPS, atau infra kompleks.

---

## 2. Keputusan Teknologi

| Aspek          | Pilihan                                            | Alasan                                                    |
| -------------- | -------------------------------------------------- | --------------------------------------------------------- |
| Framework      | Next.js 15 (App Router)                            | RSC/Server Actions, SSR untuk SEO, deploy Vercel          |
| Bahasa         | TypeScript `strict`                                | Type safety + maintainability                             |
| Styling        | Tailwind CSS v4 (CSS-first `@theme` design tokens) | Cepat, konsisten, ringan                                  |
| Animasi        | Motion (`motion/react`, pendahulu Framer Motion)   | Motion design berkualitas, `prefers-reduced-motion` mudah |
| Backend/data   | Supabase (PostgreSQL + Auth + Storage)             | Free tier, RLS, auth built-in, tidak perlu VPS            |
| Auth           | Supabase Auth (email/password)                     | Tidak build auth sendiri                                  |
| Validasi input | Zod                                                | Validation server-side + client                           |
| Testing        | Vitest (unit)                                      | Utilitas penting, order calc, RLS logic, authz            |
| Deployment     | Vercel (GitHub integration)                        | Free tier, custom domain nanti                            |
| State          | Server Components + Supabase + minimal context     | Hindari over-engineering state global                     |

**Konflik requirements yang disepakati:**

- Forum & Community feed **memakai satu tabel `posts` + `categories`** (type `forum`/`community`). Alasan: menghindari duplikasi struktur, filter cukup via category type, hemat, dan tetap scalable.
- **Tidak ada DM untuk V1** (per master prompt). Skema `notifications` sudah siap sehingga DM V2 hanya menambah tabel.
- **Payment gateway belum ada untuk V1** — dibuat `PaymentService` (abstraction layer) + order creation. Tidak ada hardcode API key.
- Musik/opening/hero **semua editable via admin** (tidak hardcode selain fallback).
- Autoplay musik diblokir browser → default `OFF`, harus diaktifkan user.

---

## 3. Arsitektur Final

```
┌──────────────────────────────┐
│         Browser (client)      │
│  React + Tailwind + Framer   │
└──────────────┬───────────────┘
               │ HTTPS / cookies (session)
┌──────────────▼───────────────┐
│     Next.js on Vercel        │
│  Server Components / Actions │
│  API Routes / Middleware     │
│                              │
│  ├─ service/  (OrderService, │
│  │    PaymentService,        │
│  │    ModerationService)     │
│  ├─ lib/supabase/ clients    │
│  └─ auth: supabase-ssr       │
└──────────────┬───────────────┘
               │ @supabase/supabase-js
┌──────────────▼───────────────┐
│          Supabase            │
│  PostgreSQL + RLS + Auth     │
│  Storage (buckets)           │
│  Mail (password reset)       │
└──────────────────────────────┘
```

Aturan penting:

- **Client hanya pakai `anon key`** + cookies session. **Tidak pernah** service_role/bahkan anon dengan ROW policy default.
- **Server pakai `service_role` HANYA** untuk operasi admin terverifikasi server-side (dengan audit log). Tidak pernah diekspos ke client.
- Authorization **harus** ada di dua lapis: RLS (DB) + Server Action/Route Handler (app). Frontend bukan security boundary.

---

## 4. Folder Structure

```
/
├─ app/
│  ├─ (site)/                 # public layout (Navbar, Footer, MusicPlayer)
│  │  ├─ page.tsx             # homepage + opening
│  │  ├─ about/
│  │  ├─ projects/
│  │  ├─ projects/[slug]/
│  │  ├─ community/
│  │  ├─ community/post/[id]/
│  │  ├─ forum/
│  │  ├─ forum/c/[slug]/
│  │  ├─ forum/t/[id]/
│  │  ├─ store/
│  │  ├─ store/product/[slug]/
│  │  ├─ music/
│  │  ├─ profile/[username]/
│  ├─ (auth)/                 # login, register, forgot/reset password
│  ├─ (account)/              # orders, order/[id], checkout (auth)
│  ├─ admin/                  # admin panel + layout terpisah
│  ├─ api/
│  │  ├─ auth/                # callbacks
│  │  └─ payment/webhook/     # stub V2 (webhook verification)
│  ├─ layout.tsx
│  └─ middleware.ts
├─ components/
│  ├─ ui/        # Button, Input, Modal, Dialog, Card, Badge, Avatar,
│  │             # Pagination, Skeleton, Toast, Drawer
│  ├─ layout/    # Navbar, Footer, MusicPlayerPlayer, OpeningScreen
│  ├─ site/      # Hero, AboutPreview, ProjectCard, ProductCard, PostCard...
│  └─ admin/     # AdminSidebar, AdminTable, FileUploader, StatCard...
├─ lib/
│  ├─ supabase/  # server.ts, browser.ts, admin.ts, middleware.ts
│  ├─ validations/  # Zod schemas
│  └─ utils.ts
├─ services/
│  ├─ PaymentService.ts   # createPayment/verifyPayment/handleWebhook (abstraction)
│  ├─ OrderService.ts     # createOrder (harga dari DB, stock lock)
│  ├─ RateLimitService.ts # DB-based limiter
│  ├─ MediaService.ts     # upload validasi MIME/size/filename
│  └─ AuditService.ts
├─ hooks/                  # useAuth, useCart, useMusic...
├─ types/                  # domain types shared
├─ utils/
├─ styles/
├─ public/
├─ supabase/
│  ├─ migrations/
│  │  ├─ 0001_initial_schema.sql   # draft desain (Phase 4 finalize)
│  │  └─ ...
│  └─ config.toml
├─ docs/                   # arquitetura, database, security
├─ tests/                  # Vitest unit/integration
├─ .env.example
├─ .env.local              # NEVER committed
├─ .gitignore
└─ package.json
```

---

## 5. Route Map

### Public (site layout)

| Route                   | Fungsi                            |
| ----------------------- | --------------------------------- |
| `/`                     | Homepage + opening animation      |
| `/about`                | Profil personal Muhammad Reinaldi |
| `/projects`             | Daftar project                    |
| `/projects/[slug]`      | Detail project                    |
| `/community`            | Feed post community               |
| `/community/post/[id]`  | Detail post + komentar            |
| `/forum`                | Daftar kategori forum             |
| `/forum/c/[slug]`       | Thread per kategori               |
| `/forum/t/[id]`         | Thread forum + komentar           |
| `/store`                | Produk                            |
| `/store/product/[slug]` | Detail produk + add to cart       |
| `/music`                | Halaman musik/playlist            |
| `/profile/[username]`   | Profil user publik                |

### Auth (guest + logged in)

| Route                                | Fungsi                          |
| ------------------------------------ | ------------------------------- |
| `/login` `/register`                 | Supabase Auth                   |
| `/forgot-password` `/reset-password` | Reset password (Supabase email) |
| `/checkout`                          | Auth required                   |
| `/orders` `/orders/[id]`             | Order milik user sendiri        |

### Admin (role admin, server-side verified)

| Route               | Fungsi                                           |
| ------------------- | ------------------------------------------------ |
| `/admin`            | Dashboard statistik                              |
| `/admin/settings`   | Visual editor (homepage, hero, tagline, opening) |
| `/admin/profile`    | Pengaturan profil personal                       |
| `/admin/projects`   | CRUD project                                     |
| `/admin/users`      | Manajemen user, suspend/ban                      |
| `/admin/community`  | Moderation post                                  |
| `/admin/categories` | CRUD kategori forum/community/produk             |
| `/admin/products`   | CRUD produk                                      |
| `/admin/orders`     | Order management semua user                      |
| `/admin/music`      | CRUD track + playlist                            |
| `/admin/media`      | Media manager                                    |
| `/admin/reports`    | Reported posts/comments/users                    |
| `/admin/audit`      | Audit log                                        |

### API / Server Actions

- Server Actions untuk seluruh mutasi (POST, comment, like, report, cart, checkout, admin).
- `api/auth/*` untuk callback Supabase.
- `api/payment/webhook` (stub, V2, harus verifikasi signature).

---

## 6. Authentication Architecture

- **Supabase Auth** (email/password), cookie session via `@supabase/ssr`.
- `middleware.ts`: refresh expired session (Server Component pattern).
- Flow:
  1. User register/login → Supabase return session.
  2. Session disimpan sebagai httpOnly secure cookie.
  3. Server Action/Server Component membaca user dari cookie.
  4. `profiles` dibuat otomatis (DB trigger saat `auth.users` insert) → default `role=user`.
- **Password reset** via Supabase email template (no custom mail server).
- `logout` → revoke session server-side.

---

## 7. Authorization Architecture

Dua lapis wajib:

1. **RLS (database) — boundary utama.**
2. **Server Action / Route Handler — boundary app.** Setiap mutasi memverifikasi `user.id` subject dan `profiles.role` actornya.

Role:

- `admin` → akses penuh admin (via service client + audit).
- `moderator` → moderation content (opsional, bisa = admin untuk V1).
- `user` → konten sendiri, order sendiri, profile sendiri.

**Tidak dipercaya:** localStorage, URL param, hidden button, client-side role.
**Pengecekan admin:** query `profiles.role` dari server (DB), bukan flag client.

Admin actions: DB RLS `select for admin` diperbolehkan lewat helper function security-definer (`app.is_admin()`) + service role server-side untuk write sensitif, selalu dicatat di `audit_logs`.

---

## 8. Deployment Architecture

```
GitHub (repo) ───► Vercel (build + hosting, Next.js)
                        │ env vars (paste via Vercel dashboard)
                        ▼
                   Supabase (Project Hosted)
                   ├─ PostgreSQL + RLS
                   ├─ Auth
                   ├─ Storage buckets
                   └─ Dashboard settings
```

- GitHub free, Vercel free tier, Supabase free tier (cukup untuk V1).
- Custom domain → Arduino di dokumentasi Phase 14.
- Env vars: lihat `.env.example`. **`NEXT_PUBLIC_*` hanya anon key; secret hanya server-side.**

---

## 9. Biaya (Budget Kecil)

| Item            | Biaya      | Catatan                                        |
| --------------- | ---------- | ---------------------------------------------- |
| GitHub          | $0         | free plan                                      |
| Vercel          | $0         | free tier cukup untuk V1                       |
| Supabase        | $0         | free tier: 500MB DB, 1GB storage, 50k MAU auth |
| Domain          | ~$8–12/thn | opsional, dibeli nanti                         |
| Payment gateway | $0 dulu    | V2, mis. Midtrans (biaya per transaksi)        |
| Rate limiting   | $0         | DB-based, tanpa Upstash                        |

**Kapan perlu bayar:** storage >1GB, MAU >50k, perlu upgrade Vercel. DIjelaskan saat fase tersebut dibutuhkan — tidak menambah layanan berbayar tanpa alasan.

---

## 10. Development Phases

1. **Phase 1** — Architecture (dokumen ini) ✅
2. **Phase 2** — Project Foundation: Next.js+TS+Tailwind+Framer, ESLint, Prettier, env, design tokens, base UI.
3. **Phase 3** — Visual System: layout, navbar, footer, opening animation, homepage, motion.
4. **Phase 4** — Supabase: migrations final, Auth, Storage, RLS, seed.
5. **Phase 5** — Authentication: register/login/logout/reset/profile/roles.
6. **Phase 6** — Personal Website: About, Projects, Profile.
7. **Phase 7** — Community: categories, feed, posts, comments, likes, reports, moderation.
8. **Phase 8** — Store: products, detail, cart, checkout, orders, order history.
9. **Phase 9** — Admin: semua manager.
10. **Phase 10** — Visual Editor: admin ubah website tanpa source code.
11. **Phase 11** — Security Hardening: audit.
12. **Phase 12** — Performance: images, query, cache, bundle.
13. **Phase 13** — Testing: unit/integration, fix TS/lint/build.
14. **Phase 14** — Deployment: GitHub, Vercel, Supabase, env, custom domain docs.

Aturan: **setelah tiap phase → jalankan checks → perbaiki error → jangan lanjut jika foundation rusak → ringkasan perubahan + command run.**

---

## 11. Keputusan Penting / Resolusi Konflik

| Konflik                     | Solusi                                                           |
| --------------------------- | ---------------------------------------------------------------- |
| Forum & feed terpisah?      | Satu tabel `posts`, kategori via `categories.type`               |
| Payment?                    | Abstraction `PaymentService`, hanya order creation V1            |
| Rate limit gratis?          | Tabel `rate_limits` di Postgres sendiri (token bucket sederhana) |
| Search tanpa Elasticsearch? | PostgreSQL `lower() ILIKE` + index trigram                       |
| Musik autoplay?             | Default OFF, toggle user, admin kelola playlist                  |
| Opening berat?              | HTML/CSS/Framer/SVG saja, ringan & bisa skip                     |
| Tanpa VPS?                  | Vercel + Supabase cukup                                          |
