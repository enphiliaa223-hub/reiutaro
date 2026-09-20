"use server";

import { redirect } from "next/navigation";
import { createServerClientScoped } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { safeInternalPath, getSiteUrl } from "@/lib/site-url";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  changePasswordSchema,
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
  const email = parsed.data.email.toLowerCase();
  const ip = await getClientIp();
  // Batas per-email + per-IP: brute-force membabi buta dicegat di dua lapis.
  if (!(await rateLimit(`login:${email}`, 5, 300))) {
    return { ok: false, error: "Terlalu banyak percobaan. Coba lagi 5 menit lagi." };
  }
  if (!(await rateLimit(`login:ip:${ip}`, 15, 300))) {
    return { ok: false, error: "Terlalu banyak percobaan. Coba lagi beberapa saat." };
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
  const email = parsed.data.email.toLowerCase();
  const ip = await getClientIp();
  if (!(await rateLimit(`signup:${email}`, 3, 3600))) {
    return { ok: false, error: "Terlalu banyak pendaftaran dari email ini." };
  }
  if (!(await rateLimit(`signup:ip:${ip}`, 6, 3600))) {
    return { ok: false, error: "Terlalu banyak pendaftaran dari perangkat ini." };
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
  const ip = await getClientIp();
  if (!(await rateLimit(`forgot:ip:${ip}`, 5, 600))) {
    return { ok: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
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

/** Ganti password sendiri: verifikasi password lama dulu, lalu set baru. */
export async function changePassword(input: unknown): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Silakan login ulang." };

  if (!(await rateLimit(`password:${user.id}`, 5, 600))) {
    return { ok: false, error: "Terlalu banyak percobaan. Coba lagi nanti." };
  }

  const supabase = await createServerClientScoped();

  // Pastikan user tahu password lama (cegah perubahan oleh sesi curian).
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email ?? "",
    password: parsed.data.currentPassword,
  });
  if (verifyError) return { ok: false, error: "Password lama salah." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) return { ok: false, error: "Gagal mengganti password. Coba lagi." };
  return { ok: true, message: "Password berhasil diganti." };
}

/** Hapus akun sendiri: bersihkan file storage, user auth, dan semua data (cascade). */
export async function deleteAccount(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Silakan login ulang." };

  if (!(await rateLimit(`delete:${user.id}`, 2, 3600))) {
    return { ok: false, error: "Terlalu banyak percobaan. Coba lagi nanti." };
  }

  try {
    const admin = createAdminClient();

    // Hapus objek storage milik user (community posts images + avatar).
    for (const bucket of ["community", "avatars"] as const) {
      const { data: list, error: listError } = await admin.storage.from(bucket).list(user.id);
      if (listError) continue;
      const paths = list.map((f) => `${user.id}/${f.name}`);
      if (paths.length > 0) await admin.storage.from(bucket).remove(paths);
    }

    // Hapus user auth → profile cascade (FK on delete cascade) → posts/comments/dll.
    const { error: delError } = await admin.auth.admin.deleteUser(user.id);
    if (delError) return { ok: false, error: "Gagal menghapus akun. Coba lagi." };

    // Bersihkan cookie session supabase.
    const supabase = await createServerClientScoped();
    await supabase.auth.signOut();
  } catch {
    return { ok: false, error: "Gagal menghapus akun. Coba lagi." };
  }

  redirect("/");
}

/** Update profil milik sendiri. owner_id SELALU dari session, bukan dari client. */
export async function updateProfile(input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Silakan login ulang." };

  // Avatar hanya boleh berasal dari storage project sendiri (cegah URL asing/abuse).
  const avatarUrl = parsed.data.avatarUrl?.trim() ?? "";
  if (
    avatarUrl !== "" &&
    !/^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/avatars\//.test(avatarUrl)
  ) {
    return { ok: false, error: "URL avatar tidak valid." };
  }

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
    avatar_url: avatarUrl || null,
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
