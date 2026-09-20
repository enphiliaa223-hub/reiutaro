import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/** Ambil IP klien (Vercel mengisi x-forwarded-for). Aman saat dipakai di server. */
export async function getClientIp(): Promise<string> {
  try {
    const h = await headers();
    const fwd = h.get("x-forwarded-for");
    return (fwd ? fwd.split(",")[0].trim() : "unknown").slice(0, 64);
  } catch {
    return "unknown";
  }
}

/**
 * Rate limiter per-key (server-only) memakai RPC atomik di DB.
 * Return true = request diperbolehkan, false = kena limit.
 * Jika RPC/Supabase belum tersedia → allow (fail-open; tidak ada data krusial).
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds = 60,
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("bump_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) return true;
    return data === true;
  } catch {
    return true;
  }
}