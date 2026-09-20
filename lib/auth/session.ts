import { redirect } from "next/navigation";
import { createServerClientScoped } from "@/lib/supabase/server";
import type { Profile } from "@/types/profile";

/** Aktif dengan cookie session; melempar error jika env belum diisi. */
export async function getServerClient() {
  return createServerClientScoped();
}

export async function getCurrentUser() {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    // Env Supabase belum diisi / koneksi gagal → perlakukan sebagai belum login.
    return null;
  }
}

/** Ambil profil user saat ini (RLS: hanya owner/admin). */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

/** Wajib login; redirect ke /login jika belum. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Wajib punya profil; redirect login jika belum. */
export async function requireProfile() {
  await requireUser();
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Wajib admin (server-side, DB); redirect ke / jika bukan. */
export async function requireAdmin() {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/");
  return profile;
}