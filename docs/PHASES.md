# REIUTAROU — Phase Log

Status per phase (diupdate tiap selesai). Referensi: `docs/ARCHITECTURE.md`.

| Phase                   | Status     | Catatan                                                                                                               |
| ----------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| 1 — Architecture        | ✅ Selesai | `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/SECURITY.md`, `supabase/migrations/0001_initial_schema.sql` (draft) |
| 2 — Project Foundation  | ✅ Selesai | Next 16 App Router, TS strict, Tailwind v4 tokens, Motion, ESLint+Prettier, env system, base UI kit                   |
| 3 — Visual System       | ✅ Selesai | Navbar, footer, opening animation, hero, ticker, previews, music player shell, motion utilities                       |
| 4 — Supabase | ⏳ Siap dijalankan | Migrasi final (0001+0002), RLS lengkap, storage buckets, seed. Tinggal execute di project (lihat `docs/SUPABASE_SETUP.md`) + isi `.env.local` |
| 5 — Authentication      | ✅ Selesai | Register/login/logout/reset/profile/roles, proxy protection, UserMenu                    |
| 6 — Personal Website    | ✅ Selesai | About, Projects, Profile, homepage settings-driven                              |
| 7 — Community           | ✅ Selesai | Kategori, feed, posts, comments, likes, reports, rate-limit                        |
| 8 — Store               | ✅ Selesai | Products, cart, checkout (harga server-side), orders                              |
| 9 — Admin               | ✅ Selesai | Dashboard, produk/konten/musik/pesanan, moderasi post & komentar, laporan, pengaturan |
| 10 — Visual Editor      | ✅ Selesai | Editor site settings admin + preview live; beranda/opening/footer settings-driven |
| 11 — Security Hardening | ✅ Selesai | Policy RLS carts, rate-limit login/signup & cart, guard stok create_order, poweredByHeader off |
| 12 — Performance        | ✅ Selesai | next.config images AVIF/WebP + poweredByHeader:false; route revalidate sudah tertata            |
| 13 — Testing            | ✅ Selesai | Vitest: 14 unit test (settings, validasi auth, safeInternalPath, orders)                        |
| 14 — Deployment Prep    | ✅ Selesai | .env.example + panduan deploy Vercel & migrasi produksi                                       |
| 15 — Rich Seed + Search | ✅ Selesai | Seed konten kaya (migrasi 0008) + halaman `/search` lintas proyek/post/produk + link navbar    |
| 11 — Security Hardening | ⏳ Belum   | Audit penuh                                                                                                           |
| 12 — Performance        | ⏳ Belum   | Image/query/cache/bundle                                                                                              |
| 13 — Testing            | ⏳ Belum   | Vitest + fix                                                                                                          |
| 14 — Deployment         | ⏳ Belum   | GitHub, Vercel, Supabase, env                                                                                         |

---

## Phase 3 — Detail File

### Dibuat

- `app/(site)/layout.tsx` — layout situs: Navbar + main + Footer + MusicPlayer
- `app/(site)/page.tsx` — homepage: Hero, AboutPreview, FeaturedProjects, CommunityPreview, StorePreview (data kosong → empty states, diisi Phase 6-8)
- `components/layout/navbar.tsx` — fixed nav, active links, mobile menu, skip-link, Logo
- `components/layout/footer.tsx` — wordmark, explore links, social (placeholder), copyright
- `components/layout/opening-screen.tsx` — splash client-side sekali/sesi, skip, auto-transition, reduced-motion
- `components/layout/music-player.tsx` — floating player global (play/pause/next/prev/seek/volume/playlist)
- `components/provider/music-provider.tsx` — context + audio engine client-side
- `components/motion/reveal.tsx` — Reveal, StaggerGroup/Item
- `components/ui/container.tsx` — Container + Section
- `components/site/section-heading.tsx`, `empty-state.tsx`, `hero.tsx`, `project-card.tsx`, `post-card.tsx`, `product-card.tsx`, `about-preview.tsx`, `community-preview.tsx`
- `types/content.ts`, `types/music.ts`, `lib/site-config.ts`, `lib/utils.ts`

### Diubah

- `app/layout.tsx` — provider global (Music, Toast) + OpeningScreen
- `components/ui/button.tsx` — polymorphic (as prop / Link)
- `docs/ARCHITECTURE.md` — Tailwind v4, Motion

### Catatan

- Opening screen tampil setelah hydrate (menghindari hydration mismatch). Homepage sempat render sekejap sebelum overlay — terima untuk V1.
- Data homepage (projects/posts/products) kosong → empty states jujur, `TODO Phase 6-8`.
- Musik playlist default kosong → empty state jujur; admin fill di Phase 9.

---

## Phase 4 — Detail File

### Final
- `supabase/migrations/0001_initial_schema.sql` — schema penuh + helper `app.is_admin()`, `app.is_moderator()`, trigon updated_at, counter likes/comments, recompute, dan **RLS policies lengkap** untuk 20 tabel
- `supabase/migrations/0002_seed_and_storage.sql` — seed kategori produk + `site_settings` default, 6 storage buckets + storage policies

### Dibuat
- `lib/supabase/client.ts` — env accessor (guard error deskriptif)
- `lib/supabase/server.ts` — client cookie (Server Components/Actions)
- `lib/supabase/browser.ts` — client browser (anon)
- `lib/supabase/admin.ts` — client service role (server-only, admin)

### Dokumentasi
- `docs/SUPABASE_SETUP.md` — langkah setup project, auth, admin, env, typegen

### Catatan
- Kredensial belum ada → `.env.local` kosong. Setelah diisi + migrasi dieksekusi, Phase 5 berjalan live.
- Admin di-set manual via SQL (`role='admin'`).
- Generate `types/database.ts` dengan `supabase gen types` setelah project dibuat (lihat setup guide).

---

## Phase 5 — Detail File

### Dibuat
- `lib/types` — `types/profile.ts` (Profile/UserRole/UserStatus)
- `lib/validations/auth.ts` — schema zod (zod v4): login, register, forgot, reset, profile
- `lib/auth/session.ts` — `getCurrentUser` (catch env kosong → null), `getCurrentProfile`, `requireUser`, `requireProfile`, `requireAdmin`
- `lib/actions/auth.ts` — server actions (all server-side, owner_id dari session): `signIn` (redirect safety via `safeInternalPath`), `signUp` (emailRedirectTo → `/auth/callback?next=/account/profile`), `signOut`, `forgotPassword`, `updatePassword`, `updateProfile` (cek username unik)
- `lib/site-url.ts` — `getSiteUrl()` + `safeInternalPath()` (anti open-redirect)
- `app/auth/callback/route.ts` — tukar `code` → session (`exchangeCodeForSession`), redirect ke `next`
- `app/(auth)/*` — layout kaca + halaman login, register, forgot-password, reset-password
- `components/auth/*` — form client (`useActionState`), load dengan `Spinner`
- `app/account/profile/page.tsx` + `components/auth/profile-form.tsx` — edit profil sendiri
- `app/profile/[username]/page.tsx` — profil publik (bio, skills, sosial, hitung post), status active only
- `components/layout/user-menu.tsx` — dropdown akun (avatar, profil, admin panel jika role, keluar) dengan reaksi perubahan sesi via `onAuthStateChange`
- `app/admin/layout.tsx` + `app/admin/page.tsx` — stub dashboard tersembunyi di balik `requireAdmin`
- `middleware.ts` → **`proxy.ts`** — refresh session, alihkan user login dari halaman auth, proteksi `/admin` (cek role via DB) & `/account`; skip saat env kosong

### Diubah
- `components/layout/navbar.tsx` — tombol Login diganti `<UserMenu />` (desktop + dropdown mobile)
- `.env.example` — tambah `NEXT_PUBLIC_SITE_URL`
- `lib/utils.ts` — token `glassCard`
- `docs/SUPABASE_SETUP.md` — SITE_URL + redirect URL

### Catatan
- Semua route auth tanpa env berfungsi (login 200); route proteksi redirect `/login` tanpa 500.
- `getCurrentUser` menangkap kegagalan env/koneksi sebagai "belum login" (UX aman sebelum config).
- Verifikasi role admin di **dua lapis**: proxy (edge) + `requireAdmin` (DB/RLS) + RLS DB itu sendiri.

---

## Phase 6 — Detail File

### Dibuat
- `lib/supabase/public.ts` — client publik (env-safe, null saat kosong)
- `lib/queries/content.ts` — `getSiteSettings`, `setting`, `getPublishedProjects`, `getFeaturedProjects`, `getProjectBySlug`, `getOwnerProfile`, `getSiteStats`
- `app/(site)/about/page.tsx` — profil about settings-driven + stats
- `app/(site)/projects/page.tsx` + `app/(site)/projects/[slug]/page.tsx` — galeri karya + detail
- `app/(site)/profile/[username]/page.tsx` — profil publik (dari Phase 5, masuk grup situs)
- `components/site/about-preview.tsx`, `project-card.tsx` (cover gambar), homepage fetch featured + settings (revalidate 300)
- `supabase/migrations/0003_seed_content.sql` — seed best-effort (proyek, post, produk, musik) merujuk profil admin

### Catatan
- Semua helper publik return null saat env kosong → UI empty state jujur, tidak pernah 500.
- `/projects/digital-universe` 404 tanpa DB — benar; akan hidup setelah migrasi.

---

## Phase 7 — Detail File

### Dibuat
- `supabase/migrations/0004_community_and_rate_limit.sql` — RPC atomik `app.bump_rate_limit(text, int, int) returns boolean` (security definer, grant service_role) + seed kategori forum & komunitas
- `lib/rate-limit.ts` — helper RPC (pakai `createAdminClient`)
- `lib/validations/community.ts` — zod: post/komentar/report (pesan error bahasa Indonesia, zod v4 `issues`)
- `lib/queries/community.ts` — `getCategories`, `getFeedPosts`, `getPostById`, `getComments`, `getMyLikeState`
- `lib/actions/community.ts` — `createPost`, `createComment`, `toggleLike`, `createReport`, `deletePost`, `deleteComment`; semua dengan owner_id dari session, rate-limit
- `components/community/*` — `post-composer`, `like-button`, `comment-form`, `report-dialog`, `feed-pagination`, `post-actions`, `comment-actions`, `reply-toggle`, `comment-item`
- `app/(site)/community/{page,new,post/[id]}` — feed (kategori + paginasi), buat post, detail + komentar (reply satu level)

### Catatan
- Batas minimal: owner boleh hapus; admin/moderator kelola via Phase 9. RLS dua lapis.
- 21 error narrowing TS di-fix dengan discriminated union `Authed = {kind:"auth"|"ok"}`.
- `.next` perlu dihapus sekali karena route pindah grup.

---

## Phase 8 — Detail File

### Dibuat
- `supabase/migrations/0005_store.sql` — RPC `app.create_order(text...) returns jsonb`: **harga dihitung ulang dari tabel products (anti-forge)**, validasi stok, snapshot order_items, kosongkan cart, `grant execute to authenticated` (bukan operasi admin → tidak via service role)
- `lib/queries/store.ts` — `getProductCategories`, `getProducts(categorySlug?)`, `getProductBySlug`, `getCartSummary` (subtotal server-side), `getMyOrders`, `getMyOrder`
- `lib/actions/store.ts` — `addToCart`, `updateCartItem`, `removeCartItem` (RLS owner), `checkout` (zod; total dihitung di DB)
- `lib/constants/orders.ts` — `ORDER_STATUS_META` (label + warna + teks tiap status)
- `components/store/*` — `add-to-cart` (qty stepper + login-redirect), `cart-quantity-control`, `cart-badge` (live count via realtime), `checkout-form`
- `app/(site)/store/{page, product/[slug]}` — browse (filter kategori) + detail produk (galeri, stok, AddToCart)
- `app/account/{cart, checkout, orders, order/[id]}` — cart, checkout, daftar pesanan, detail pesanan
- `components/site/product-card.tsx` — pakai cover `product_images[0]`

### Catatan
- Rute `/account` baru masuk pola `proxy.ts` matcher → auto redirect ke login tanpa env.
- Pembayaran V1 = manual admin (`awaiting_payment`); PaymentService abstraction (ARSITEKTUR) untuk V2.

---

## Phase 9 — Detail File

### Dibuat
- `supabase/migrations/0006_admin.sql` — RPC `app.adjust_stock(uuid, integer)` (security definer, guard `app.is_admin()`, stok tidak di bawah 0) untuk aksi "Dibayar"
- `lib/actions/admin.ts` — semua server action dengan `requireAdmin()`: `updateOrderStatus` (decrement stok sekali saat transisi ke paid), `saveProduct`/`deleteProduct` (slug unik, hapus = nonaktif), `saveProject`/`deleteProject` (arsip), `saveTrack`/`deleteTrack`, `deletePost`, `deleteComment`, `resolveReport`, `saveSettings` (whitelist key, nilai JSON valid)
- `lib/queries/admin.ts` — `getDashboardStats` (KPI + revenue), orders, products, product, project, posts, comments, reports, tracks, track, settings
- `components/admin/*` — `admin-nav` (sidebar aktif), `upload-field` (upload storage RLS admin, path `<bucket>/<uid>/<ts>-<nama>`), `product-form`, `project-form`, `track-form`, `order-status-form`, `settings-form`, `confirm-delete`
- `app/admin/**` — layout sidebar; dashboard (KPI + pesanan terbaru); `products/{page,new,[id]/edit}`; `orders/{page,[id]}` (ubah status + lihat data pembeli); `projects/{page,new,[id]/edit}`; `music/{page,new,[id]/edit}`; `posts`, `comments`, `reports` (moderasi + tutup laporan); `settings`

### Catatan
- Prasyarat teknis Next: file "use server" HANYA boleh ekspor fungsi async → konstanta seperti `PRODUCT_TYPES`/`PROJECT_STATUSES` dibuat non-export.
- Upload media pakai browser client (RLS storage admin), bukan service role — sesuai arsitektur.
- Semua route admin redirect `/login` tanpa env (smoke test 307); situs publik tetap 200.

---

---

## Phase 10 — Detail File

### Dibuat
- `lib/settings.ts` — `NormalizedSettings` + `DEFAULT_SETTINGS` + `normalizeSettings(rows)` (parsing footer_socials, boolean/number aman)
- `components/site/hero.tsx` — kini props `settings` (brand, kicker, tagline, description dari DB)
- `components/layout/opening-screen.tsx` — props `settings` (title/subtitle/duration/enabled/showSkip)
- `components/layout/footer.tsx` — async, ambil `site_settings`: brand progresif + owner + social dari `footer_socials`
- `app/layout.tsx` — async, fetch settings → pass ke OpeningScreen; `app/(site)/page.tsx` → Hero
- `components/admin/visual-editor.tsx` — form per seksi (Brand, Hero, Opening, Tentang, Footer, Lainnya) dengan input bertipe (string/boolean/number/json) + papan **preview live**
- `app/admin/settings/page.tsx` — halaman Visual Editor
- `lib/actions/admin.ts#saveSettings` — tipe disimpan sesuai jenis key (string apa adanya, boolean/number diparsing) dengan whitelist

### Catatan
- Site kini benar-benar settings-driven tanpa perlu `site-config` hardcoded di komponen tampilan.
- Tanpa env, `getSiteSettings()` → null → fallback `DEFAULT_SETTINGS` (perilaku lama tetap sama).

---

## Perbaikan Lanjutan (Post-Phase 15)
- ✅ Crash client saat env Supabase kosong diperbaiki: `CartBadge` & `UserMenu` guard `createBrowserClientScoped()` dalam try/catch + fallback UI (user = "belum login", badge count disembunyikan).
- ✅ Halaman `/music` dibuat (dulu 404): query `getActiveTracks()` (return `[]` saat DB off) + `MusicProvider initialTracks` di root layout + `TrackList` interaktif + player floating.
