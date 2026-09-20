"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeCartItem, updateCartItem } from "@/lib/actions/store";
import { Spinner } from "@/components/ui/spinner";

export function CartQuantityControl({
  itemId,
  quantity,
  stock,
}: {
  itemId: string;
  quantity: number;
  stock: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: number) {
    if (next < 1) return;
    if (stock > 0 && next > stock) return;
    setPending(true);
    setError(null);
    const result = await updateCartItem(itemId, next);
    setPending(false);
    if (result.ok) {
      router.refresh();
    } else {
      setError((result as { error: string }).error ?? "Gagal.");
    }
  }

  async function remove() {
    setPending(true);
    const result = await removeCartItem(itemId);
    setPending(false);
    if (result.ok) router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-lg border border-ink-700">
        <button
          type="button"
          onClick={() => change(quantity - 1)}
          disabled={pending || quantity <= 1}
          className="flex h-9 w-9 items-center justify-center text-ink-400 transition-colors hover:text-gold-400 disabled:opacity-40"
          aria-label="Kurangi"
        >
          −
        </button>
        <span className="w-9 text-center text-sm font-semibold text-paper-50">
          {pending ? <Spinner className="mx-auto h-3 w-3" /> : quantity}
        </span>
        <button
          type="button"
          onClick={() => change(quantity + 1)}
          disabled={pending || (stock > 0 && quantity >= stock)}
          className="flex h-9 w-9 items-center justify-center text-ink-400 transition-colors hover:text-gold-400 disabled:opacity-40"
          aria-label="Tambah"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="text-xs text-danger transition-opacity hover:opacity-80"
      >
        Hapus
      </button>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}