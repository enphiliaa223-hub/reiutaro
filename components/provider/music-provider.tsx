"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { MusicTrack } from "@/types/music";

interface MusicContextValue {
  tracks: MusicTrack[];
  current: MusicTrack | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  playTrack: (index: number) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({
  children,
  initialTracks = [],
}: {
  children: ReactNode;
  initialTracks?: MusicTrack[];
}) {
  const [tracks] = useState<MusicTrack[]>(initialTracks);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Audio dibuat hanya di client (hindari masalah SSR).
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = 0.8;

    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      audioRef.current?.load();
      setCurrentIndex((i) => (i < tracks.length - 1 ? i + 1 : 0));
    };
    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);

    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
      audioRef.current = null;
    };
  }, [tracks.length]);

  const current = currentIndex >= 0 && currentIndex < tracks.length ? tracks[currentIndex] : null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    audio.src = current.src;
    void audio.play().catch(() => setIsPlaying(false));
  }, [current]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  const playTrack = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(index, tracks.length - 1)));
      setIsPlaying(true);
    },
    [tracks.length],
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) {
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [current]);

  const next = useCallback(() => {
    setCurrentIndex((i) => (i < tracks.length - 1 ? i + 1 : 0));
  }, [tracks.length]);

  const prev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : tracks.length - 1));
  }, [tracks.length]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = time;
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)));
  }, []);

  const value = useMemo(
    () => ({
      tracks,
      current,
      isPlaying,
      volume,
      progress,
      duration,
      playTrack,
      togglePlay,
      next,
      prev,
      seek,
      setVolume,
    }),
    [
      tracks,
      current,
      isPlaying,
      volume,
      progress,
      duration,
      playTrack,
      togglePlay,
      next,
      prev,
      seek,
      setVolume,
    ],
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic harus dipakai di dalam <MusicProvider>");
  return ctx;
}
