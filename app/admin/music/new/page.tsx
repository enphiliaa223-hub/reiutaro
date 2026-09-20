import type { Metadata } from "next";
import { TrackForm } from "@/components/admin/track-form";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Lagu Baru — Admin" };

export default async function NewTrackPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl text-white">Lagu baru</h1>
      <TrackForm />
    </div>
  );
}