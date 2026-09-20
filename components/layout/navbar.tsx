"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui";
import { Container } from "@/components/ui/container";
import { UserMenu } from "@/components/layout/user-menu";
import { CartBadge } from "@/components/store/cart-badge";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Community", href: "/community" },
  { label: "Store", href: "/store" },
  { label: "Music", href: "/music" },
  { label: "Search", href: "/search" },
] as const;

export function Logo({ className }: { className?: string }) {
  return (
    <span
      translate="no"
      data-no-translate
      className={cn("font-display text-lg uppercase tracking-wide", className)}
    >
      <span className="text-paper-50">Reiuta</span>
      <span className="text-gold-400">rou</span>
    </span>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Skip link untuk aksesibilitas */}
      <a
        href="#main"
        className="sr-only z-[70] rounded-md bg-gold-400 px-4 py-2 text-sm font-semibold text-ink-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-all duration-300",
          scrolled || open
            ? "border-b border-ink-800 bg-ink-950/85 backdrop-blur-md"
            : "bg-transparent",
        )}
      >
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link href="/" aria-label="REIUTAROU — Home" className="shrink-0">
            <Logo />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group relative rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
                    active ? "text-gold-400" : "text-paper-200 hover:text-paper-50",
                  )}
                >
                  {link.label}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-3 -bottom-0.5 h-0.5 origin-left rounded-full bg-gold-400 transition-transform duration-300",
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <CartBadge />
            <div className="hidden sm:block">
              <UserMenu />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <span className="relative block h-3.5 w-5">
                <span
                  className={cn(
                    "absolute left-0 top-0 h-0.5 w-5 bg-current transition-all duration-300",
                    open && "top-1/2 -translate-y-1/2 rotate-45",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 bg-current transition-all duration-300",
                    open && "opacity-0",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 bottom-0 h-0.5 w-5 bg-current transition-all duration-300",
                    open && "bottom-1/2 translate-y-1/2 -rotate-45",
                  )}
                />
              </span>
            </Button>
          </div>
        </Container>

        {/* Mobile nav */}
        <AnimatePresence>
          {open && (
            <motion.nav
              id="mobile-nav"
              aria-label="Mobile"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden border-t border-ink-800 bg-ink-950/95 backdrop-blur-md md:hidden"
            >
              <Container className="flex flex-col gap-1 py-4">
                {NAV_LINKS.map((link) => {
                  const active =
                    link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium transition-colors",
                        active ? "bg-gold-400/10 text-gold-400" : "text-paper-100 hover:bg-ink-800",
                      )}
                    >
                      {link.label}
                      {active ? (
                        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold-400" />
                      ) : null}
                    </Link>
                  );
                })}

                <div className="mt-2 border-t border-ink-800 pt-3">
                  <UserMenu mobile />
                </div>
              </Container>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
