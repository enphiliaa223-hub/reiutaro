import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-svh bg-night-950">
      <header className="sticky top-0 z-30 border-b border-ink-800/60 bg-night-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/admin" className="font-display text-lg text-white">
            REIUTAROU<span className="text-neon-300"> /admin</span>
          </Link>
          <Link href="/" className="text-sm text-ink-400 hover:text-white">
            Lihat situs
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row">
        <AdminNav />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}