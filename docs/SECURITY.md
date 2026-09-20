# REIUTAROU — Security Model

Goal: **minimize attack surface + defense in depth + secure defaults**. Tidak ada klaim "100% secure".

---

## 1. Threat Model (v1)

| #   | Threat                      | Vector                              | Mitigation                                                                                      | Severity |
| --- | --------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------- | -------- |
| 1   | Data breach (DB)            | Service key bocor                   | service_role HANYA server, never di env publik/GitHub; RLS aktif semua tabel                    | Critical |
| 2   | Broken auth                 | Session theft                       | Supabase Auth, httpOnly secure cookies, `SameSite=Lax`, refresh di middleware, revoke di logout | Critical |
| 3   | Privilege escalation        | Client mengedit `role` / `owner_id` | RLS + server action cek `auth.uid()`; role admin dari DB, bukan client                          | Critical |
| 4   | See others' orders          | IDOR order                          | RLS `user_id=uid`, server action verifikasi owner                                               | High     |
| 5   | Price manipulation          | Client kirim price/total            | `OrderService` ambil harga dari DB, hitung total server-side, stock lock transaksional          | High     |
| 6   | Stock tampering             | Quantity dari client                | validasi & decrement atomik dengan `UPDATE ... WHERE stock>=qty RETURNING`                      | High     |
| 7   | XSS (UGC)                   | Post/comment payload                | render text-only + sanitize (zod/marquee), no raw HTML; CSP                                     | High     |
| 8   | SQL injection               | Input user                          | Supabase param-based query, tanpa string interpolation                                          | High     |
| 9   | File upload attack          | PHP/HTML/exe                        | MIME + magic byte + extension whitelist + size limit + safe path + server-side validation       | High     |
| 10  | Brute force login           | Auth endpoint                       | Supabase rate limit bawaan + `rate_limits` DB (login/register/reset)                            | Medium   |
| 11  | Spam/abuse                  | report/post flood                   | rate limit per user (DB token bucket)                                                           | Medium   |
| 12  | CSRF                        | Mutasi via cookie                   | SameSite+Lax, verifikasi origin/referrer di server actions; method check                        | Medium   |
| 13  | Secret leak                 | .env/Git                            | `.gitignore` + `.env.example` placeholder + review history sebelum push pertama                 | Critical |
| 14  | Payment fraud (V2)          | Fake paid webhook                   | Webhook signature verif, status diverifikasi server-side, tidak percaya client                  | High     |
| 15  | SSRF via URL input          | gambar dari URL                     | Validasi URL scheme; prefer upload                                                              | Medium   |
| 16  | Data exfiltration via error | Stack trace exposures               | sanitized error handling, umum "Something went wrong"                                           | High     |
| 17  | Dependency vuln             | npm packages                        | `npm audit`, lockfile committed, template minimal                                               | Medium   |
| 18  | Admin abuse                 | admin action                        | audit_logs (actor, action, target, ts)                                                          | Medium   |
| 19  | Enumeration                 | username/email                      | rate limit, generic error messages                                                              | Low      |
| 20  | Clickjacking                | embed                               | `X-Frame-Options: DENY` / CSP `frame-ancestors 'none'`                                          | Low      |

---

## 2. Defense-in-Depth Layers

1. **Edge**: HTTPS (Vercel), security headers, CSP.
2. **App**: Server-only secrets, Zod validation, server actions authorization, rate limiting, sanitized errors.
3. **DB**: RLS + policies + constraints + indexes, service-role hanya server.
4. **Content**: UGC dianggap untrusted; text-only render, no `dangerouslySetInnerHTML` kecuali white-listed sanitizer.

---

## 3. Input Validation & Output Sanitization

- Zod schema di setiap mutasi penting (registration fields, posts, comments, products, orders, admin forms).
- UGC render sebagai **teks biasa** (dobel-escape). Link URL: relative atau whitelist scheme (`https`, `mailto`).
- Tidak ada `dangerouslySetInnerHTML` dari data user. Konten panjang project yang butuh format → parse markdown-safe (tanpa raw HTML) atau sanitizer (DOMPurify) di V2 jika perlu.

---

## 4. Upload Validation (MediaService)

- Cek: MIME via file signature (magic bytes) → **bukan** hanya extension.
- Whitelist extension: images `png jpg jpeg webp gif svg?` (SVG = RISK → simpan sebagai `image/svg+xml` non-executable, render via `<img>` tanpa inline script, idealnya dilarang di upload publik); audio `mp3 ogg m4a webm`.
- Size: image ≤5MB, audio ≤20MB.
- Safer filename: `bucket/uid/timestamp-uuid.ext`, filename asli disimpan hanya di `media.filename` untuk display.
- Storage policy per bucket (lihat DATABASE.md §5).

---

## 5. Rate Limiting (DB-based, gratis)

`RateLimitService` memakai tabel `rate_limits` (key = `action:userIdOrIP`), sliding window / token bucket.

| Action                   | Limit (rencana)          |
| ------------------------ | ------------------------ |
| login / register / reset | 5 / 15 menit per akun/IP |
| create post              | 10 / jam                 |
| comment                  | 30 / jam                 |
| report                   | 10 / jam                 |
| checkout                 | 5 / 15 menit             |
| admin action             | 60 / 10 menit            |

IP dari trusted proxy header (Vercel `x-real-ip`), jangan pernah percaya `x-forwarded-for` langsung.

---

## 6. Audit Log

Dicatat via `AuditService` untuk: admin login, delete user, delete/hide post, product change, order status change, media upload, site settings change, category change.
Fields: `actor_id`, `action`, `target_type`, `target_id`, `metadata jsonb`, `created_at`. Tidak pernah simpan password/secret di log.

---

## 7. Env / Secrets

- `.env.local` tidak pernah di-commit (`gitignore`).
- `.env.example` berisi placeholder hanya.
- Pemisahan: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client-safe) vs `SUPABASE_SERVICE_ROLE_KEY` + future `PAYMENT_*` (server-only).
- Sebelum push pertama: pastikan tidak ada secret di history.

---

## 8. Payment Architecture (V2-ready)

```
Client ── createOrder (productId, qty) → OrderService (DB:harga, stock, total)
OrderService → PaymentService.createPayment(order)
Gateway → webhook → PaymentService.handleWebhook (verify signature)
PaymentService.verifyPayment(status) → update order (server-side, bukan dari browser)
```

- Secret gateway hanya di env server. Tidak pernah di frontend.
- Order tidak pernah berubah status berdasarkan request browser saja.

---

## 9. Security Headers (Phase 11 detail)

`strict-transport-security`, `x-content-type-options: nosniff`, `x-frame-options: DENY`, `referrer-policy`, `permissions-policy`, CSP (`default-src 'self'`, images/audio dari Supabase origin, style self+inline, script self+nonce bila kompatibel dengan Next.js).

---

## 10. Security Review Checklist (sesuai master prompt §53)

Saat Phase 11: auth, authorization, RLS, API routes, server actions, file upload, UGC, XSS, SQLi, CSRF, CORS, rate limiting, secrets, cookies, security headers, payment architecture, admin access, order manipulation, stock manipulation, dependency vulnerabilities. Tiap temuan dilaporkan = `{vektor, severity, lokasi file, perbaikan, residual risk}`.
