"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createReport, REPORT_REASONS } from "@/lib/actions/community";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";

export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: "post" | "comment" | "user" | "product";
  targetId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    const result = await createReport({ targetType, targetId, reason, detail });
    setPending(false);
    if (result.ok) {
      setDone(true);
    } else if ("error" in result) {
      setError(result.error ?? "Gagal mengirim laporan.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-ink-400 transition-colors hover:text-danger"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" strokeLinecap="round" />
        </svg>
        Laporkan
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Laporkan konten">
        {done ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-emerald-400">Terima kasih! Laporan diterima.</p>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setDone(false);
                router.refresh();
              }}
              className="text-sm text-neon-300 underline-offset-4 hover:underline"
            >
              Tutup
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-11 w-full rounded-lg border border-ink-700 bg-ink-900 px-3 text-sm text-paper-100 outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            >
              <option value="">Pilih alasan...</option>
              {REPORT_REASONS.map((reasonOption) => (
                <option key={reasonOption} value={reasonOption}>
                  {reasonOption.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <Textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Detail tambahan (opsional)"
            />
            <div className="flex justify-end">
              <Button type="button" onClick={submit} disabled={pending || !reason}>
                {pending ? <Spinner className="h-4 w-4" /> : "Kirim laporan"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}