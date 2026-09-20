"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { saveTrack, type ActionResult } from "@/lib/actions/admin";
import { Input } from "@/components/ui/input";
import { Button, buttonStyles } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { UploadField } from "@/components/admin/upload-field";

const initialState: ActionResult = { ok: false, error: "" };

export function TrackForm({
  track,
}: {
  track?: {
    id: string;
    title: string;
    artist: string;
    album: string | null;
    cover_url: string | null;
    audio_url: string | null;
    duration: number | null;
    active: boolean;
    sort_order: number;
  };
}) {
  const router = useRouter();
  const [cover, setCover] = useState<string[]>(track?.cover_url ? [track.cover_url] : []);
  const [audio, setAudio] = useState<string[]>(track?.audio_url ? [track.audio_url] : []);
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => {
      const result = await saveTrack({
        id: track?.id,
        title: String(formData.get("title") ?? ""),
        artist: String(formData.get("artist") ?? ""),
        album: String(formData.get("album") ?? ""),
        coverUrl: cover[0] ?? null,
        audioUrl: audio[0] ?? null,
        durationSeconds: Number(formData.get("durationSeconds") ?? 0) || undefined,
        active: formData.get("active") === "on",
        sortOrder: Number(formData.get("sortOrder") ?? 0),
      });
      if (result.ok) {
        router.push("/admin/music");
        router.refresh();
      }
      return result;
    },
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.ok === false && state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="title" className="text-xs font-medium uppercase tracking-wider text-ink-400">
            Judul lagu
          </label>
          <Input id="title" name="title" required defaultValue={track?.title} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="artist" className="text-xs font-medium uppercase tracking-wider text-ink-400">
            Artis
          </label>
          <Input id="artist" name="artist" required defaultValue={track?.artist} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="album" className="text-xs font-medium uppercase tracking-wider text-ink-400">
            Album (opsional)
          </label>
          <Input id="album" name="album" defaultValue={track?.album ?? ""} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="durationSeconds" className="text-xs font-medium uppercase tracking-wider text-ink-400">
            Durasi (detik)
          </label>
          <Input id="durationSeconds" name="durationSeconds" type="number" min={0} defaultValue={track?.duration ?? 0} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="sortOrder" className="text-xs font-medium uppercase tracking-wider text-ink-400">
            Urutan
          </label>
          <Input id="sortOrder" name="sortOrder" type="number" defaultValue={track?.sort_order ?? 0} />
        </div>
      </div>

      <UploadField bucket="music" label="Cover lagu" value={cover} onChange={setCover} accept="image/*" />
      <UploadField bucket="music" label="File audio (MP3/OGG)" preview={false} value={audio} onChange={setAudio} accept="audio/*" />

      <label className="flex items-center gap-2 text-sm text-ink-300">
        <input type="checkbox" name="active" defaultChecked={track?.active ?? true} className="accent-gold-400" />
        Aktif (muncul di player)
      </label>

      <div className="flex justify-end gap-3">
        <a href="/admin/music" className={buttonStyles({ variant: "ghost", size: "md" })}>
          Batal
        </a>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Spinner className="h-4 w-4" /> : track ? "Simpan lagu" : "Tambah lagu"}
        </Button>
      </div>
    </form>
  );
}