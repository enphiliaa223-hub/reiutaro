import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminOrder } from "@/lib/queries/admin";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_META } from "@/lib/constants/orders";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { requireAdmin } from "@/lib/auth/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Pesanan ${id.slice(0, 8)} — Admin` };
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();
  const order = await getAdminOrder(id);
  if (!order) notFound();
  const meta = ORDER_STATUS_META[order.status as keyof typeof ORDER_STATUS_META];

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-ink-400 transition-colors hover:text-neon-300">
        ← Semua pesanan
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl text-paper-50">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-ink-400">
            {new Date(order.createdAt).toLocaleString("id-ID")}
          </p>
        </div>
        <span className={`rounded-md px-2.5 py-1 text-xs uppercase tracking-wide ${meta?.badge ?? ""}`}>
          {meta?.label ?? order.status}
        </span>
      </div>

      <div className="mt-6 rounded-xl border border-ink-800 bg-ink-900/60 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-400">Status</h2>
        <div className="mt-3">
          <OrderStatusForm orderId={order.id} current={order.status} />
        </div>
        <p className="mt-3 text-xs text-ink-500">
          Catatan: status <span className="text-ink-300">Dibayar</span> otomatis mengurangi stok
          produk (sekali saja). Pembayaran dikonfirmasi manual pada V1.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-ink-800 bg-ink-900/60 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-400">Ringkasan</h2>
        <ul className="mt-3 space-y-2">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-paper-100">
                {item.productName} <span className="text-ink-500">× {item.quantity}</span>
              </span>
              <span className="text-paper-50">{formatCurrency(item.subtotal, order.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between border-t border-ink-800 pt-3">
          <span className="text-sm text-ink-400">Total ({order.currency})</span>
          <span className="text-xl font-semibold text-gold-400">
            {formatCurrency(order.total, order.currency)}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-ink-800 bg-ink-900/60 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-400">Data pembeli</h2>
        <dl className="mt-3 grid gap-2 text-sm text-ink-300 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-ink-500">Nama</dt>
            <dd className="text-paper-100">{order.customerName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">Email</dt>
            <dd className="text-paper-100">{order.customerEmail ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">No. HP</dt>
            <dd className="text-paper-100">{order.customerPhone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">Alamat</dt>
            <dd className="text-paper-100">{order.customerAddress ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-ink-500">Catatan</dt>
            <dd className="text-paper-100">{order.notes ?? "—"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}