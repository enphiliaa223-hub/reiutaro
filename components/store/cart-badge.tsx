"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClientScoped } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

export function CartBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const supabase = (() => {
      try {
        return createBrowserClientScoped();
      } catch {
        // Supabase belum dikonfigurasi → sembunyikan live count (icon tetap tampil).
        return null;
      }
    })();
    if (!supabase) return;
    const client = supabase;
    let active = true;

    async function load() {
      let uid: string | null = null;
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) {
        if (active) setCount(null);
        return;
      }
      uid = user.id;
      const { data: cart } = await client
        .from("carts")
        .select("id")
        .eq("user_id", uid)
        .maybeSingle();
      if (!cart) {
        if (active) setCount(0);
        return;
      }
      const { count: n } = await client
        .from("cart_items")
        .select("id", { count: "exact", head: true })
        .eq("cart_id", cart.id);
      if (active) setCount(n ?? 0);
    }
    void load();

    const channel = client
      .channel("cart-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "cart_items" }, () => {
        void load();
      })
      .subscribe();

    return () => {
      active = false;
      void client.removeChannel(channel);
    };
  }, []);

  return (
    <Link
      href="/account/cart"
      aria-label="Keranjang belanja"
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-lg border border-ink-700 text-ink-300",
        "transition-colors hover:border-gold-500/60 hover:text-gold-400",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="h-5 w-5"
      >
        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="17" cy="20" r="1.4" />
      </svg>
      {count !== null && count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-ink-950">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}