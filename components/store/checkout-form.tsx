"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { checkout, type ActionResult } from "@/lib/actions/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const initialState: ActionResult = { ok: false, error: "" };

export function CheckoutForm({ initialEmail }: { initialEmail: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => {
      const result = await checkout({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        address: String(formData.get("address") ?? ""),
        notes: String(formData.get("notes") ?? ""),
      });
      if (result.ok && result.orderId) {
        router.push(`/account/order/${result.orderId}`);
      }
      return result as ActionResult;
    },
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.ok === false && state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-ink-400">
            Nama
          </label>
          <Input id="name" name="name" required placeholder="Nama penerima" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-ink-400">
            Email
          </label>
          <Input id="email" name="email" type="email" required defaultValue={initialEmail} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="phone" className="text-xs font-medium uppercase tracking-wider text-ink-400">
          No. HP (opsional)
        </label>
        <Input id="phone" name="phone" placeholder="+62 812-3456-7890" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="address" className="text-xs font-medium uppercase tracking-wider text-ink-400">
          Alamat (opsional)
        </label>
        <Input id="address" name="address" placeholder="Jalan, kota, kode pos" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notes" className="text-xs font-medium uppercase tracking-wider text-ink-400">
          Catatan (opsional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Catatan untuk pesanan — maks 1000 karakter"
          className="w-full resize-none rounded-lg border border-ink-700 bg-ink-900/80 px-3 py-2 text-sm text-paper-50 placeholder:text-ink-500 focus:border-neon-400 focus:outline-none focus:ring-1 focus:ring-neon-400/40"
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? <Spinner className="h-4 w-4" /> : "Buat pesanan"}
      </Button>
    </form>
  );
}