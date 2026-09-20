"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/actions/store";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function AddToCart({
  productId,
  stock,
  isAuthed,
  slug,
}: {
  productId: string;
  stock: number;
  isAuthed: boolean;
  slug: string;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outOfStock = stock <= 0;

  async function submit() {
    if (!isAuthed) {
      router.push(`/login?next=${encodeURIComponent(`/store/product/${slug}`)}`);
      return;
    }
    setPending(true);
    setError(null);
    const result = await addToCart(productId, quantity);
    setPending(false);
    if (result.ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } else {
      setError((result as { error: string }).error ?? "Gagal menambahkan.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-ink-700">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-11 w-10 items-center justify-center text-ink-400 transition-colors hover:text-gold-400"
            aria-label="Kurangi jumlah"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-semibold text-paper-50">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(stock || 99, q + 1))}
            className="flex h-11 w-10 items-center justify-center text-ink-400 transition-colors hover:text-gold-400"
            aria-label="Tambah jumlah"
          >
            +
          </button>
        </div>

        <Button type="button" onClick={submit} disabled={pending || outOfStock} className="flex-1">
          {pending ? (
            <Spinner className="h-4 w-4" />
          ) : outOfStock ? (
            "Stok habis"
          ) : added ? (
            "✓ Ditambahkan"
          ) : (
            "Tambahkan ke cart"
          )}
        </Button>
      </div>

      {error ? (
        <p className={cn("text-sm", error.includes("login") ? "text-neon-300" : "text-red-300")}>
          {error}
        </p>
      ) : null}
    </div>
  );
}