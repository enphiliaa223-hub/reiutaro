import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Buat Password Baru — Reiutaro" };

export default async function ResetPasswordPage() {
  // Dijangkau SETELAH /auth/callback menukar kode → session aktif.
  // Tanpa session berarti tautan rusak.
  const user = await getCurrentUser();
  if (!user) redirect("/forgot-password");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl text-white">Buat password baru</h1>
        <p className="mt-1 text-sm text-ink-400">Minimal 8 karakter.</p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}