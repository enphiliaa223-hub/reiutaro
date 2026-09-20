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