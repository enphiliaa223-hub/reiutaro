import Link from "next/link";
import { Container } from "@/components/ui/container";
import { getSiteSettings } from "@/lib/queries/content";
import { normalizeSettings } from "@/lib/settings";

const EXPLORE_LINKS = [
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Community", href: "/community" },
  { label: "Store", href: "/store" },
] as const;

export async function Footer() {
  const settings = await getSiteSettings();
  const s = normalizeSettings(settings);

  const brandStart = s.brand.slice(0, Math.max(0, s.brand.length - 3));
  const brandEnd = s.brand.slice(-3);
  const socialLinks = s.footerSocials.filter((link) => link.label);

  return (
    <footer className="relative mt-auto border-t border-ink-800 bg-ink-950">
      <Container className="py-14 sm:py-20">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-3xl uppercase leading-none tracking-tight sm:text-4xl">
              <span translate="no" data-no-translate className="text-paper-50">{brandStart}</span>
              <span translate="no" data-no-translate className="text-gold-400">{brandEnd}</span>
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-300">
              A personal digital universe by{" "}
              <span className="font-medium text-paper-100">{s.ownerName}</span> — projects,
              anime community, store, and music.
            </p>
          </div>

          <nav aria-label="Explore">
            <p className="text-kicker uppercase text-gold-400">Explore</p>
            <ul className="mt-4 space-y-2.5">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-paper-200 transition-colors duration-200 hover:text-gold-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-kicker uppercase text-gold-400">Social</p>
            <ul className="mt-4 space-y-2.5">
              {socialLinks.length > 0 ? (
                socialLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.url || "#"}
                      className="text-sm text-paper-200 transition-colors duration-200 hover:text-gold-400"
                    >
                      {link.label}
                    </a>
                  </li>
                ))
              ) : (
                <li className="text-sm text-ink-500">Belum ada link sosial.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ink-800 pt-6 text-xs text-ink-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {s.brand} · {s.ownerName}
          </p>
          <p className="uppercase tracking-widest">Anime · Games · Music · Universe</p>
        </div>
      </Container>
    </footer>
  );
}
