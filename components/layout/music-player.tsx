"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMusic } from "@/components/provider/music-provider";
import { cn } from "@/lib/utils";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M8 5.14v13.72L19 12 8 5.14z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path d="M9 18V5l12-2v13M9 6l12-2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

export function MusicPlayer() {
  const music = useMusic();
  const [expanded, setExpanded] = useState(false);

  const { current, isPlaying, tracks, volume, progress, duration } = music;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/95 shadow-pop backdrop-blur-md"
            role="region"
            aria-label="Music player"
          >
            <div className="flex items-center justify-between border-b border-ink-800 px-4 py-3">
              <p className="text-kicker uppercase text-gold-400">Now Playing</p>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Close music player"
                className="rounded-md p-1 text-ink-400 transition-colors hover:text-paper-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {tracks.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                <NoteIcon className="h-8 w-8 text-ink-500" />
                <p className="text-sm text-ink-300">
                  Belum ada musik. Admin dapat mengunggah playlist melalui Music Manager.
                </p>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-night-700 to-ink-800 ring-1 ring-ink-700">
                    {current?.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={current.cover} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <NoteIcon className="h-6 w-6 text-gold-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-paper-50">
                      {current?.title ?? "No track"}
                    </p>
                    <p className="truncate text-xs text-ink-400">
                      {current?.artist ?? "Unknown artist"}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.5}
                    value={progress}
                    onChange={(e) => music.seek(Number(e.target.value))}
                    aria-label="Seek"
                    className="h-1.5 w-full cursor-pointer accent-gold-400"
                  />
                  <div className="mt-1 flex justify-between text-[10px] tabular-nums text-ink-400">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={music.prev}
                    aria-label="Previous track"
                    className="rounded-md p-2 text-paper-200 transition-colors hover:text-gold-400"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                      <path d="M6 6h2v12H6zM20 6v12L10 12l10-6z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={music.togglePlay}
                    aria-label={isPlaying ? "Pause" : "Play"}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-400 text-ink-950 shadow-gold transition-transform duration-150 hover:scale-105 active:scale-95"
                  >
                    {isPlaying ? (
                      <PauseIcon className="h-5 w-5" />
                    ) : (
                      <PlayIcon className="ml-0.5 h-5 w-5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={music.next}
                    aria-label="Next track"
                    className="rounded-md p-2 text-paper-200 transition-colors hover:text-gold-400"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                      <path d="M6 6l10 6-10 6V6zM16 6h2v12h-2z" />
                    </svg>
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 shrink-0 text-ink-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden
                  >
                    <path
                      d="M11 5 6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M19 6a9 9 0 0 1 0 12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => music.setVolume(Number(e.target.value))}
                    aria-label="Volume"
                    className="h-1.5 w-full cursor-pointer accent-gold-400"
                  />
                </div>

                <div className="mt-4 max-h-32 space-y-1 overflow-y-auto border-t border-ink-800 pt-3">
                  {tracks.map((track, i) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => music.playTrack(i)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                        current?.id === track.id
                          ? "bg-gold-400/10 text-gold-400"
                          : "text-paper-200 hover:bg-ink-800",
                      )}
                    >
                      <PlayIcon className="h-3 w-3 shrink-0" />
                      <span className="truncate">{track.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating toggle */}
      <motion.button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? "Hide music player" : "Open music player"}
        aria-expanded={expanded}
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gold-400 text-ink-950 shadow-gold transition-transform duration-150 hover:scale-105 active:scale-95"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isPlaying && current ? (
          <span className="flex h-4 items-end gap-[3px]" aria-hidden>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-[3px] rounded-full bg-ink-950"
                animate={{ height: [4, 12, 4] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay: i * 0.18,
                  ease: "easeInOut",
                }}
              />
            ))}
          </span>
        ) : (
          <NoteIcon className="h-5 w-5" />
        )}
      </motion.button>
    </div>
  );
}
