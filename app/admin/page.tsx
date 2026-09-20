import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { getAdminOrders, getDashboardStats } from "@/lib/queries/admin";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_META } from "@/lib/constants/orders";

export const metadata: Metadata = { title: "Dashboard Admin — Reiutaro" };

export default async function AdminDashboardPage() {
  const profile = await requireStaff();
  if (profile.role !== "admin") redirect("/admin/products");

  const [stats, orders] = await Promise.all([getDashboardStats(), getAdminOrders()]);

  const statCards = [
    { label: "Pengguna", value: stats?.users },
    { label: "Produk aktif", value: stats?.products },
    { label: "Pesanan", value: stats?.orders },
    { label: "Pendapatan (paid)", value: stats?.revenue, money: true },
    { label: "Pendapatan hari ini", value: stats?.revenueToday, money: true },
    { label: "Laporan terbuka", value: stats?.pendingReports },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl text-white">Dashboard</h1>
        <Badge variant="neon">Admin</Badge>
      </div>
      <p className="text-sm text-ink-400">
        Login sebagai <span className="text-white">@{profile?.username}</span>. Data ditampilkan
        live dari database.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-ink-800 bg-ink-900/60 p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-paper-50">
              {card.money ? formatCurrency(card.value ?? 0) : card.value ?? "—"}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-display text-lg text-paper-50">Pesanan terbaru</h2>
        {!orders || orders.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">Belum ada pesanan.</p>
        ) : (
          <div className="mt-3 divide-y divide-ink-800 overflow-hidden rounded-xl border border-ink-800">
            {orders.slice(0, 6).map((order) => {
              const meta = ORDER_STATUS_META[order.status as keyof typeof ORDER_STATUS_META];
              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 bg-ink-900/40 p-4 transition-colors hover:bg-ink-900"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm text-paper-50">{order.orderNumber}</p>
                    <p className="truncate text-xs text-ink-400">{order.userName}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs uppercase tracking-wide ${meta?.badge ?? ""}`}>
                      {meta?.label ?? order.status}
                    </span>
                    <span className="font-semibold text-paper-50">
                      {formatCurrency(order.total, order.currency)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-300"
        >
          + Produk baru
        </Link>
        <Link
          href="/admin/projects/new"
          className="rounded-lg border border-ink-600 px-4 py-2 text-sm text-paper-50 transition-colors hover:border-gold-400 hover:text-gold-400"
        >
          + Proyek baru
        </Link>
      </div>
    </div>
  );
}