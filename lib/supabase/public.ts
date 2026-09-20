import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/client";

/**
 * Supabase client untuk PEMBACAAN data publik (Server Components, tanpa cookies).
 * Tidak menyimpan sesi. Untuk operasi user/authed pakai server.ts.
 */
export function createPublicClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}