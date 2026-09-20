import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getMyOrder } from "@/lib/queries/store";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_META } from "@/lib/constants/orders";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Pesanan ${id.slice(0, 8)} — Reiutaro` };
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const order = await getMyOrder(id);
  if (!order) notFound();

  const meta = ORDER_STATUS_META[order.status as keyof typeof ORDER_STATUS_META];

  return (
    <div>
      <Link href="/account/orders" className="text-sm text-ink-400 transition-colors hover:text-neon-300">
        ← Semua pesanan
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl text-paper-50">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-ink-400">
            Dibuat{" "}
            {new Date(order.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <span className={`rounded-md px-2.5 py-1 text-xs uppercase tracking-wide ${meta?.badge ?? "bg-ink-800 text-paper-100"}`}>
          {meta?.label ?? order.status}
        </span>
      </div>

      <p className="mt-3 text-sm text-ink-300">{meta?.text ?? ""}</p>

      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-ink-800 bg-ink-900/60 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-400">Ringkasan</h2>
          <ul className="mt-3 space-y-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-4 text-sm">
                <span className="text-paper-100">
                  {item.productName}{" "}
                  <span className="text-ink-500">× {item.quantity}</span>
                </span>
                <span className="text-paper-50">{formatCurrency(item.subtotal, order.currency)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t border-ink-800 pt-3">
            <span className="text-sm text-ink-400">
              Total ({order.currency})
            </span>
            <span className="text-xl font-semibold text-gold-400">
              {formatCurrency(order.total, order.currency)}
            </span>
          </div>
        </div>

        {(order.customerName ||
          order.customerEmail ||
          order.customerAddress ||
          order.customerPhone ||
          order.notes) ? (
          <div className="rounded-xl border border-ink-800 bg-ink-900/60 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
              Data pembeli & catatan
            </h2>
            <dl className="mt-3 grid gap-2 text-sm text-ink-300 sm:grid-cols-2">
              {order.customerName ? (
                <div>
                  <dt className="text-xs text-ink-500">Nama</dt>
                  <dd className="text-paper-100">{order.customerName}</dd>
                </div>
              ) : null}
              {order.customerEmail ? (
                <div>
                  <dt className="text-xs text-ink-500">Email</dt>
                  <dd className="text-paper-100">{order.customerEmail}</dd>
                </div>
              ) : null}
              {order.customerPhone ? (
                <div>
                  <dt className="text-xs text-ink-500">No. HP</dt>
                  <dd className="text-paper-100">{order.customerPhone}</dd>
                </div>
              ) : null}
              {order.customerAddress ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-ink-500">Alamat</dt>
                  <dd className="text-paper-100">{order.customerAddress}</dd>
                </div>
              ) : null}
              {order.notes ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-ink-500">Catatan</dt>
                  <dd className="text-paper-100">{order.notes}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}
      </div>

      <p className="mt-6 text-xs text-ink-500">
        Untuk pertanyaan soal pesanan, hubungi admin (pembayaran dikonfirmasi manual pada V1).
      </p>
    </div>
  );
}