import type { Metadata } from "next";
import Link from "next/link";
import { getAdminTracks } from "@/lib/queries/admin";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { deleteTrack } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Musik — Admin" };

export default async function AdminMusicPage() {
  const tracks = await getAdminTracks();

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl text-white">Musik</h1>
        <Link
          href="/admin/music/new"
          className="rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-300"
        >
          + Lagu baru
        </Link>
      </div>

      {!tracks || tracks.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-ink-700 bg-ink-900/40 p-10 text-center">
          <p className="text-sm text-ink-400">
            {tracks === null ? "DB belum terhubung." : "Belum ada lagu."}
          </p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-ink-800 overflow-hidden rounded-xl border border-ink-800">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center justify-between gap-4 bg-ink-900/40 p-4 transition-colors hover:bg-ink-900"
            >
              <Link href={`/admin/music/${track.id}/edit`} className="min-w-0 flex-1">
                <p className="truncate font-medium text-paper-50">{track.title}</p>
                <p className="truncate text-xs text-ink-400">
                  {track.artist} · {track.duration_seconds ? `${track.duration_seconds}s` : "tanpa durasi"}
                </p>
              </Link>
              <div className="flex shrink-0 items-center gap-3">
                <Badge variant={track.active ? "success" : "ink"}>{track.active ? "Aktif" : "Nonaktif"}</Badge>
                <ConfirmDelete
                  label="Hapus"
                  confirmLabel={`Hapus "${track.title}"?`}
                  action={() => deleteTrack(track.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}