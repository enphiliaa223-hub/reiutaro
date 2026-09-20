"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/client";

/**
 * Supabase client untuk browser. Memakai anon key + cookie session yang
 * di-set otomatis oleh server. Jangan pernah taruh service role di sini.
 */
export function createBrowserClientScoped() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}