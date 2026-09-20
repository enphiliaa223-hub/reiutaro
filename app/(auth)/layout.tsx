import Link from "next/link";
import { glassCard } from "@/lib/utils";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="font-display text-2xl tracking-tight text-white transition-colors hover:text-neon-300"
      >
        REIUTAROU<span className="text-neon-300">.</span>
      </Link>

      <div className={`mt-8 w-full max-w-sm ${glassCard} p-6`}>{children}</div>

      <p className="mt-6 text-xs text-ink-500">
        © {new Date().getFullYear()} Reiutaro. Semua konten orisinal.
      </p>
    </main>
  );
}