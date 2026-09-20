"use client";

import { formatCurrency } from "@/lib/utils";
import type { AdminReportRow } from "@/lib/queries/admin";
import { ORDER_STATUS_META } from "@/lib/constants/orders";
import { Button } from "@/components/ui/button";

export type ReportFilters = {
  from?: string;
  to?: string;
  status?: string;
  paymentStatus?: string;
};

const PAYMENT_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Lunas",
  void: "Void",
};

/** Unduh CSV (BOM UTF-8 agar terbuka benar di Excel). */
function downloadCsv(rows: AdminReportRow[]) {
  const header = ["No. Order", "Tanggal", "Email", "Status", "Pembayaran", "Jumlah Item", "Total (IDR)"];
  const lines = rows.map((r) => [
    r.orderNumber,
    new Date(r.createdAt).toLocaleString("id-ID"),
    r.customerEmail ?? "",
    ORDER_STATUS_META[r.status as keyof typeof ORDER_STATUS_META]?.label ?? r.status,
    PAYMENT_LABELS[r.paymentStatus] ?? r.paymentStatus,
    String(r.itemCount),
    r.total.toFixed(0),
  ]);
  const csv = [header, ...lines]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `laporan-transaksi-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ReportTable({ rows }: { rows: AdminReportRow[] }) {
  const total = rows.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm text-ink-300">
          <span>
            {rows.length} transaksi — total{" "}
            <span className="text-gold-400">{formatCurrency(total)}</span>
          </span>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => downloadCsv(rows)}>
            Export CSV
          </Button>
          <Button type="button" size="sm" variant="neon" onClick={() => window.print()}>
            Cetak PDF
          </Button>
        </div>
      </div>

      <div id="print-report" className="overflow-x-auto rounded-lg border border-ink-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-800 text-left text-kicker uppercase tracking-wider text-ink-400">
              <th className="px-4 py-3">No. Order</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Pembayaran</th>
              <th className="px-4 py-3 text-right">Item</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-ink-800/60 last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-paper-50">{r.orderNumber}</td>
                <td className="px-4 py-3 text-ink-300">
                  {new Date(r.createdAt).toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-3 text-ink-300">{r.customerEmail ?? "—"}</td>
                <td className="px-4 py-3 text-ink-300">
                  {ORDER_STATUS_META[r.status as keyof typeof ORDER_STATUS_META]?.label ?? r.status}
                </td>
                <td className="px-4 py-3 text-ink-300">
                  {PAYMENT_LABELS[r.paymentStatus] ?? r.paymentStatus}
                </td>
                <td className="px-4 py-3 text-right text-ink-300">{r.itemCount}</td>
                <td className="px-4 py-3 text-right font-mono text-paper-50">
                  {formatCurrency(r.total)}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-500">
                  Tidak ada transaksi dalam rentang ini.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-report,
          #print-report * {
            visibility: visible;
          }
          #print-report {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            border: none;
          }
          #print-report table {
            color: #000;
          }
        }
      `}</style>
    </div>
  );
}