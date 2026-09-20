"use client";

import { useEffect } from "react";
import { createBrowserClientScoped } from "@/lib/supabase/browser";

type PingChannel = {
  subscribe(cb: (status: string) => void): unknown;
  track(state: unknown): Promise<unknown>;
};

/**
 * Ping kehadiran global: tiap user yang login meng-track dirinya di channel
 * Realtime "online" (presence key = user.id) sehingga admin bisa melihat
 * siapa yang sedang online. Opsional — bila env Supabase belum ada, dilewati.
 */
export function PresencePing() {
  useEffect(() => {
    let supabase: ReturnType<typeof createBrowserClientScoped> | null = null;
    let channel: PingChannel | null = null;
    let cancelled = false;

    const start = async () => {
      try {
        supabase = createBrowserClientScoped();
      } catch {
        return; // env belum dikonfigurasi
      }
      const { data } = await supabase.auth.getUser();
      if (cancelled || !data.user) return;

      const ch = supabase.channel("online", {
        config: { presence: { key: data.user.id } },
      });
      channel = ch;
      ch.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await ch.track({ online_at: new Date().toISOString() });
        }
      });
    };

    start();

    return () => {
      cancelled = true;
      if (supabase && channel) supabase.removeChannel(channel as never);
    };
  }, []);

  return null;
}