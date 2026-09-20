import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminTrack } from "@/lib/queries/admin";
import { TrackForm } from "@/components/admin/track-form";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { deleteTrack } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Edit Lagu — Admin" };

export default async function EditTrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const track = await getAdminTrack(id);
  if (!track) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl text-white">Edit lagu</h1>
        <ConfirmDelete label="Hapus" confirmLabel="Hapus lagu ini?" action={() => deleteTrack(track.id)} />
      </div>
      <TrackForm track={track} />
    </div>
  );
}