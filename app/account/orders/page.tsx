import type { Metadata } from "next";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getMyOrders } from "@/lib/queries/store";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_META } from "@/lib/constants/orders";

export const metadata: Metadata = { title: "Pesanan Saya — Reiutaro" };

export default async function OrdersPage() {
  await requireUser();
  const orders = await getMyOrders();

  return (
    <div>
      <h1 className="font-display text-2xl text-white">Pesanan saya</h1>

      {!orders || orders.length === 0 ? (
        <div className="mt-8 rounded-xl border border-ink-800 bg-ink-900/60 p-10 text-center">
          <p className="text-ink-300">
            {orders === null ? "Gagal memuat pesanan." : "Belum ada pesanan."}
          </p>
          {orders !== null ? (
            <Link href="/store" className={buttonStyles({ variant: "primary", size: "md", className: "mt-5" })}>
              Belanja sekarang
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => {
            const meta = ORDER_STATUS_META[order.status as keyof typeof ORDER_STATUS_META];
            return (
              <Link
                key={order.id}
                href={`/account/order/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-800 bg-ink-900/60 p-4 transition-colors hover:border-gold-500/50"
              >
                <div>
                  <p className="font-mono text-sm text-paper-50">{order.orderNumber}</p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {new Date(order.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
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
  );
}