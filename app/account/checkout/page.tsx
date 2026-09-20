import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/store/checkout-form";
import { requireUser } from "@/lib/auth/session";
import { getCartSummary } from "@/lib/queries/store";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Checkout — Reiutaro" };

export default async function CheckoutPage() {
  const user = await requireUser();
  const cart = await getCartSummary();

  if (!cart || cart.items.length === 0) redirect("/account/cart");

  return (
    <div>
      <h1 className="font-display text-2xl text-white">Checkout</h1>
      <p className="mt-1 text-sm text-ink-400">
        {cart.items.length} item · subtotal{" "}
        <span className="font-semibold text-gold-400">{formatCurrency(cart.subtotal, "USD")}</span>
      </p>

      <div className="mt-6 rounded-xl border border-ink-800 bg-ink-900/40 p-4">
        <ul className="space-y-1.5 text-sm text-ink-300">
          {cart.items.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-4">
              <span className="truncate">
                {item.name} <span className="text-ink-500">× {item.quantity}</span>
              </span>
              <span className="shrink-0 text-paper-50">
                {formatCurrency(item.subtotal, item.currency)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-baseline justify-between border-t border-ink-800 pt-3 text-sm">
          <span className="text-ink-400">Total</span>
          <span className="text-lg font-semibold text-gold-400">
            {formatCurrency(cart.subtotal, "USD")}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <CheckoutForm initialEmail={user.email ?? ""} />
      </div>

      <p className="mt-4 text-xs text-ink-500">
        Pembayaran dikonfirmasi manual oleh admin (V1). Setelah submit, pesanan berstatus{" "}
        <span className="text-ink-300">awaiting payment</span>.
        <Link href="/store" className="ml-2 text-neon-300 hover:underline">
          ← Ubah isi cart
        </Link>
      </p>
    </div>
  );
}