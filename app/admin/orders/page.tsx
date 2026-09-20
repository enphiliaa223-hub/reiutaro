import type { Metadata } from "next";
import Link from "next/link";
import { getAdminOrders } from "@/lib/queries/admin";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_META } from "@/lib/constants/orders";

export const metadata: Metadata = { title: "Pesanan — Admin" };

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div>
      <h1 className="font-display text-xl text-white">Pesanan</h1>

      {!orders || orders.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-ink-700 bg-ink-900/40 p-10 text-center">
          <p className="text-sm text-ink-400">
            {orders === null ? "DB belum terhubung." : "Belum ada pesanan."}
          </p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-ink-800 overflow-hidden rounded-xl border border-ink-800">
          {orders.map((order) => {
            const meta = ORDER_STATUS_META[order.status as keyof typeof ORDER_STATUS_META];
            return (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between gap-4 bg-ink-900/40 p-4 transition-colors hover:bg-ink-900"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm text-paper-50">{order.orderNumber}</p>
                  <p className="truncate text-xs text-ink-400">
                    {order.userName} · {order.itemCount} item
                  </p>
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
  );
}