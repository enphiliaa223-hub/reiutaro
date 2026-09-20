# REIUTAROU — Supabase Setup Guide (Phase 4)

Target free tier (tanpa biaya untuk V1). Ikuti urutan ini.

---

## 1. Buat Project Supabase

1. Buka https://supabase.com → Sign Up (GitHub/email).
2. **New project** → nama bebas (mis. `reiutaro`), **region** pilih yang terdekat (Singapore untuk Indonesia), password database (simpan aman).
3. Tunggu provisioning (±2 menit).

## 2. Jalankan Migrations

Masuk ke project → **SQL Editor → New query**. Salin-tempel kedua file, jalankan berurutan:

| Urutan | File |
|---|---|
| 1 | `supabase/migrations/0001_initial_schema.sql` |
| 2 | `supabase/migrations/0002_seed_and_storage.sql` |
| 3 | `supabase/migrations/0003_seed_content.sql` |
| 4 | `supabase/migrations/0004_community_and_rate_limit.sql` |
| 5 | `supabase/migrations/0005_store.sql` |
| 6 | `supabase/migrations/0006_admin.sql` |
| 7 | `supabase/migrations/0007_security.sql` |
| 8 | `supabase/migrations/0008_seed_rich.sql` |

Catatan 0002 membuat 6 storage bucket otomatis (`avatars`, `community`, `projects`, `products`, `music`, `media`) beserta policy-nya. 0003–0004–0005 adalah seed konten + RPC rate-limit & checkout (harga dihitung server-side). 0007 menambah policy RLS `carts` (tanpa ini cart gagal dibuat) dan guard stok di `create_order`. 0008 menambah seed konten kaya (produk/proyek/musik tambahan) — opsional, boleh dijalankan kapan pun.

> Alternatif CLI: `npm i -g supabase` → `supabase login` → `supabase link --project-ref <ref>` → `supabase db push`.

## 3. Konfigurasi Auth

**Authentication → Providers → Email**: pastikan `Enable Sign up` aktif.

**Authentication → URL Configuration**:
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/**`, dan (untuk email konfirmasi/reset) URL produksi bila sudah ada
- (Setelah deploy: tambahkan URL domain Vercel + custom domain)

**Authentication → Email Templates / Hooks**: default sudah cukup (template password reset ikut otomatis).

## 4. Buat Akun Admin

Setelah Phase 5 selesai (register via website), jadikan diri sendiri admin lewat SQL Editor:

```sql
update public.profiles
set role = 'admin'
where username = '<username-kamu>';   -- username saat register
```

Jangan set `role` lewat client — hanya bisa diubah server/database.

## 5. Environment Variables

Salin `.env.example` → `.env.local`, isi:

- `NEXT_PUBLIC_SUPABASE_URL` → Settings → API → **Project URL**
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Settings → API → **anon public**
- `SUPABASE_SERVICE_ROLE_KEY` → Settings → API → **service_role** (JANGAN expose, server-only)
- `NEXT_PUBLIC_SITE_URL` → base URL situs (default `http://localhost:3000`) — dipakai untuk redirect email verifikasi & reset password

Lalu jalankan `npm run dev`.

## 6. TypeScript Types (opsional tapi disarankan)

```bash
npx supabase gen types typescript --project-id <project-ref> --schema public > types/database.ts
```

Project-ref terlihat di URL dashboard (`supabase.com/dashboard/project/<ref>`).
Jalankan ulang setiap schema berubah.

## 7. Menampilkan Gambar Supabase (saat Phase 6)

Tambahkan `remotePatterns` di `next.config.ts`:

```ts
images: {
  remotePatterns: [{ protocol: "https", hostname: "<ref>.supabase.co" }],
},
```

## 8. Deploy (Vercel / platform Node lainnya)

1. Push repo ke GitHub, import di Vercel (framework Next.js, build `npm run build`).
2. Di **Vercel → Project → Settings → Environment Variables**, isi 4 variabel yang sama seperti `.env.example` (nilai production, `NEXT_PUBLIC_SITE_URL` = `https://domain-mu`).
3. **Jalankan migrasi 0001–0007 di project Supabase production SEBELUM deploy pertama** (lihat bagian 2 — SQL Editor atau `supabase db push`).
4. Update **Authentication → URL Configuration** di Supabase: Site URL + Redirect URLs pakai domain production, bukan localhost.
5. Set role admin pada akunmu: Table Editor → `profiles` → atur `role = 'admin'` untuk baris usermu.
6. Redeploy bila perlu. Verifikasi `https://domain-mu/login` dan coba login admin.

> `next.config.ts` sudah mematikan `poweredByHeader` dan mengaktifkan format gambar AVIF/WebP — tidak perlu konfigurasi tambahan.

---

## Verifikasi

```bash
npm run lint && npm run typecheck && npm run build
```

Cek di dashboard Supabase → **Table Editor**: tabel `profiles`, `categories`
(7 forum + 5 produk), `site_settings`, dan 6 bucket harus ada.

---

## Catatan Biaya

Supabase free tier cukup untuk V1 (500MB DB, 1GB storage, 50k MAU auth).
Jika storage >1GB atau MAU >50k → upgrade Pro (~$25/bln) — tidak diperlukan dulu.