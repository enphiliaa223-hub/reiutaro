"use server";

import { redirect } from "next/navigation";
import { createServerClientScoped } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { safeInternalPath, getSiteUrl } from "@/lib/site-url";
import { rateLimit } from "@/lib/rate-limit";
import {
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export async function signIn(input: unknown, next?: string | null): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  if (!(await rateLimit(`login:${parsed.data.email.toLowerCase()}`, 5, 300))) {
    return { ok: false, error: "Terlalu banyak percobaan. Coba lagi 5 menit lagi." };
  }
  const supabase = await createServerClientScoped();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: "Email atau password salah." };
  redirect(safeInternalPath(next));
}

export async function signUp(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  if (!(await rateLimit(`signup:${parsed.data.email.toLowerCase()}`, 3, 3600))) {
    return { ok: false, error: "Terlalu banyak pendaftaran dari email ini." };
  }
  const supabase = await createServerClientScoped();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        username: parsed.data.username,
        display_name: parsed.data.displayName,
      },
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/account/profile`,
    },
  });

  if (error) return { ok: false, error: error.message };

  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { ok: false, error: "Email sudah terdaftar. Silakan login." };
  }

  if (data.session) {
    // Konfirmasi email nonaktif di project → langsung masuk.
    redirect("/account/profile");
  }
  return {
    ok: true,
    message: "Akun dibuat. Cek email untuk konfirmasi sebelum login.",
  };
}

export async function signOut(): Promise<ActionResult> {
  const supabase = await createServerClientScoped();
  await supabase.auth.signOut();
  redirect("/");
}

export async function forgotPassword(input: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Email tidak valid" };
  }
  const supabase = await createServerClientScoped();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, message: "Cek email kamu untuk tautan reset password." };
}

/** Update password (setelah kode di-exchange via /auth/callback). */
export async function updatePassword(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Password tidak valid" };
  }
  const supabase = await createServerClientScoped();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: error.message };
  return { ok: true, message: "Password diperbarui. Silakan login." };
}

/** Update profil milik sendiri. owner_id SELALU dari session, bukan dari client. */
export async function updateProfile(input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Silakan login ulang." };

  const supabase = await createServerClientScoped();

  // Cek username tidak dipakai user lain.
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", parsed.data.username)
    .neq("id", user.id)
    .maybeSingle();
  if (existing) return { ok: false, error: "Username sudah dipakai." };

const update = {
    username: parsed.data.username,
    display_name: parsed.data.displayName,
    bio: parsed.data.bio && parsed.data.bio.trim() !== "" ? parsed.data.bio : null,
  };

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);
  if (error) return { ok: false, error: "Gagal menyimpan profil." };
  return { ok: true, message: "Profil tersimpan." };
}

/** Redirect login dengan target internal (amankan open redirect). */
export async function goLogin(next?: string | null) {
  redirect(`/login?next=${encodeURIComponent(safeInternalPath(next))}`);
}
