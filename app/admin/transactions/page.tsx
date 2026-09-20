import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminOrdersForReport, type AdminReportFilters } from "@/lib/queries/admin";
import { ReportTable } from "@/components/admin/report-table";
import { ORDER_STATUS_META } from "@/lib/constants/orders";

export const metadata: Metadata = { title: "Transaksi — Admin" };

const PAYMENT_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Lunas" },
  { value: "failed", label: "Gagal" },
  { value: "refunded", label: "Dikembalikan" },
];

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<AdminReportFilters>;
}) {
  await requireAdmin();
  const params = await searchParams;

  // Normalisasi input query (tanggal -> valid ISO; status -> whitelist).
  const filters: AdminReportFilters = {
    from: params.from && /^\d{4}-\d{2}-\d{2}$/.test(params.from) ? params.from : undefined,
    to: params.to && /^\d{4}-\d{2}-\d{2}$/.test(params.to) ? params.to : undefined,
    status: params.status && params.status in ORDER_STATUS_META ? params.status : undefined,
    paymentStatus: PAYMENT_OPTIONS.some((p) => p.value === params.paymentStatus)
      ? params.paymentStatus
      : undefined,
  };

  const rows = await getAdminOrdersForReport(filters);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl text-white">Transaksi</h1>
      <p className="text-sm text-ink-400">
        Laporan transaksi. Filter lalu unduh sebagai CSV (Excel) atau cetak ke PDF.
      </p>

      {/* Filter (GET -> server component re-render) */}
      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-ink-800 bg-ink-900/40 p-4">
        <label className="space-y-1 text-xs text-ink-400">
          Dari
          <input type="date" name="from" defaultValue={filters.from ?? ""}
            className="block rounded-md border border-ink-700 bg-night-950 px-3 py-2 text-sm text-white" />
        </label>
        <label className="space-y-1 text-xs text-ink-400">
          Sampai
          <input type="date" name="to" defaultValue={filters.to ?? ""}
            className="block rounded-md border border-ink-700 bg-night-950 px-3 py-2 text-sm text-white" />
        </label>
        <label className="space-y-1 text-xs text-ink-400">
          Status
          <select name="status" defaultValue={filters.status ?? ""}
            className="block rounded-md border border-ink-700 bg-night-950 px-3 py-2 text-sm text-white">
            <option value="">Semua status</option>
            {Object.entries(ORDER_STATUS_META).map(([value, meta]) => (
              <option key={value} value={value}>{meta.label}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-ink-400">
          Pembayaran
          <select name="paymentStatus" defaultValue={filters.paymentStatus ?? ""}
            className="block rounded-md border border-ink-700 bg-night-950 px-3 py-2 text-sm text-white">
            <option value="">Semua</option>
            {PAYMENT_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </label>
        <button type="submit"
          className="rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-gold-300">
          Terapkan
        </button>
      </form>

      {rows ? (
        <ReportTable rows={rows} />
      ) : (
        <p className="text-sm text-ink-400">Gagal memuat transaksi.</p>
      )}
    </div>
  );
}