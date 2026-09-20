/**
 * Env accessor Supabase — melempar error deskriptif saat dipanggil
 * sebelum .env.local diisi. Hanya boleh dipanggil di server code path
 * yang benar-benar memakai database (libat-lazily).
 */

export function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL belum diisi. Salin .env.example ke .env.local dan isi dari Supabase Project Settings → API.",
    );
  }
  return url;
}

/** Anon key — aman untuk client (browser). */
export function getSupabaseAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi. Ambil dari Supabase Project Settings → API.",
    );
  }
  return key;
}

/** Service role key — SERVER ONLY. Jangan pernah di-import file client. */
export function getSupabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum diisi (server-side only). Isi di .env.local.",
    );
  }
  return key;
}