"use client";

import { useMusic } from "@/components/provider/music-provider";
import { cn } from "@/lib/utils";

function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} fill="currentColor" aria-hidden>
      <path d="M8 5.14v13.72L19 12 8 5.14z" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function EqualizerGlyph({ className }: { className?: string }) {
  return (
    <span className={cn("flex h-4 items-end gap-[3px]", className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[3px] animate-pulse rounded-full bg-gold-400"
          style={{ height: `${[8, 14, 10][i]}px`, animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

export function TrackList() {
  const music = useMusic();
  const { tracks, current, isPlaying } = music;

  if (tracks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-700 px-6 py-16 text-center">
        <p className="text-sm text-paper-200">Belum ada musik dipublikasikan.</p>
        <p className="mt-1 text-xs text-ink-400">
          Admin dapat mengunggah audio lewat Music Manager, lalu mengaktifkan track-nya.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {tracks.map((track, i) => {
        const isCurrent = current?.id === track.id;
        const playing = isCurrent && isPlaying;
        return (
          <li
            key={track.id}
            className={cn(
              "flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors",
              isCurrent
                ? "border-gold-500/40 bg-gold-400/5"
                : "border-ink-800 bg-ink-900/40 hover:border-ink-600",
            )}
          >
            <button
              type="button"
              onClick={() =>
                isCurrent ? music.togglePlay() : music.playTrack(i)
              }
              aria-label={playing ? `Jeda ${track.title}` : `Putar ${track.title}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-400 text-ink-950 shadow-gold transition-transform hover:scale-105 active:scale-95"
            >
              {playing ? <PauseGlyph /> : <PlayGlyph className="ml-0.5" />}
            </button>

            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate text-sm font-semibold",
                  isCurrent ? "text-gold-300" : "text-paper-50",
                )}
              >
                {track.title}
              </p>
              <p className="truncate text-xs text-ink-400">
                {track.artist ?? "Unknown artist"}
              </p>
            </div>

            {isCurrent ? <EqualizerGlyph /> : null}
          </li>
        );
      })}
    </ul>
  );
}