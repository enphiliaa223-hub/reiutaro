"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/lib/actions/admin";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

const STATUSES = [
  "awaiting_payment",
  "paid",
  "processing",
  "completed",
  "pending",
  "cancelled",
  "refunded",
] as const;

const LABELS: Record<(typeof STATUSES)[number], string> = {
  awaiting_payment: "Menunggu pembayaran",
  paid: "Dibayar",
  processing: "Diproses",
  completed: "Selesai",
  pending: "Pending",
  cancelled: "Dibatalkan",
  refunded: "Dikembalikan",
};

export function OrderStatusForm({
  orderId,
  current,
}: {
  orderId: string;
  current: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(current);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await updateOrderStatus(orderId, status);
    setPending(false);
    if (result.ok) {
      router.refresh();
    } else {
      setError((result as { error?: string }).error ?? "Gagal.");
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <label htmlFor="order-status" className="text-xs font-medium uppercase tracking-wider text-ink-400">
          Status pesanan
        </label>
        <select
          id="order-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-56 rounded-lg border border-ink-700 bg-ink-900/80 px-3 py-2 text-sm text-paper-50"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" size="sm" disabled={pending || status === current}>
        {pending ? <Spinner className="h-4 w-4" /> : "Simpan status"}
      </Button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </form>
  );
}