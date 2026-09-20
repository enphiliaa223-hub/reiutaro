"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/profile";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard", adminOnly: false },
  { href: "/admin/products", label: "Produk", adminOnly: false },
  { href: "/admin/orders", label: "Pesanan", adminOnly: true },
  { href: "/admin/transactions", label: "Transaksi", adminOnly: true },
  { href: "/admin/users", label: "Pengguna", adminOnly: true },
  { href: "/admin/projects", label: "Konten", adminOnly: true },
  { href: "/admin/music", label: "Musik", adminOnly: true },
  { href: "/admin/posts", label: "Post", adminOnly: true },
  { href: "/admin/comments", label: "Komentar", adminOnly: true },
  { href: "/admin/reports", label: "Laporan", adminOnly: true },
  { href: "/admin/settings", label: "Pengaturan", adminOnly: true },
] as const;

export function AdminNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const links = ADMIN_LINKS.filter((link) => !link.adminOnly || role === "admin");
  return (
    <nav aria-label="Admin" className="flex shrink-0 flex-wrap gap-1 md:w-44 md:flex-col">
      {links.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-neon-600/15 text-neon-300"
                : "text-ink-300 hover:bg-ink-900 hover:text-white",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}