import type { Metadata } from "next";
import { ProfileForm } from "@/components/auth/profile-form";
import { requireProfile } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Profil Saya — Reiutaro" };

export default async function AccountProfilePage() {
  const profile = await requireProfile();

  return (
    <div className="space-y-6">
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
      <ProfileForm profile={profile} />
    </div>
  );
}