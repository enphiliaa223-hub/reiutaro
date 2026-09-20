import Link from "next/link";
import { Container } from "@/components/ui/container";
import { glassCard } from "@/lib/utils";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-night-950">
      <header className="border-b border-ink-800/60">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="font-display text-lg text-white transition-colors hover:text-neon-300">
            REIUTAROU<span className="text-neon-300">.</span>
          </Link>
          <Link href="/" className="text-sm text-ink-400 hover:text-white">
            Kembali ke situs
          </Link>
        </Container>
      </header>

      <main className={`mx-auto mt-10 w-full max-w-3xl px-4 ${glassCard} p-6`}>
        {children}
      </main>
    </div>
  );
}