import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/lib/supabase/client";

/**
 * Supabase client dengan service role key.
 * SERVER-ONLY: hanya boleh dipakai di Server Actions/Route Handlers untuk
 * operasi admin sensitif (dengan audit log). DILARANG di-import dari client.
 */
export function createAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Versi env-safe: kembalikan null bila SERVICE ROLE key belum diisi,
 * supaya fitur tidak melempar error di runtime saat env belum terkonfigurasi.
 */
export function createAdminClientIfConfigured() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }
  return createAdminClient();
}