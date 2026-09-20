import type { Metadata } from "next";
import { ProfileForm } from "@/components/auth/profile-form";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { DeleteAccountButton } from "@/components/auth/delete-account-button";
import { requireProfile } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Profil Saya — Reiutaro" };

export default async function AccountProfilePage() {
  const profile = await requireProfile();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl text-white">Profil saya</h1>
        <p className="mt-1 text-sm text-ink-400">
          @{profile.username} · bergabung{" "}
          {new Date(profile.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-lg text-white">Data profil</h2>
        <ProfileForm profile={profile} />
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg text-white">Keamanan</h2>
        <ChangePasswordForm />
      </section>

      <section className="space-y-4 rounded-xl border border-danger/30 bg-danger/5 p-5">
        <h2 className="font-display text-lg text-danger">Zona berbahaya</h2>
        <DeleteAccountButton />
      </section>
    </div>
  );
}