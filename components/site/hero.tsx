"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Button } from "@/components/ui";
import type { NormalizedSettings } from "@/lib/settings";

const TICKER_ITEMS = [
  "Anime",
  "Games",
  "Music",
  "Community",
  "Art",
  "Code",
  "Japanese Culture",
  "Store",
  "Creation",
] as const;

export function Hero({ settings }: { settings: NormalizedSettings }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yBg = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 120]);
  const yContent = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 60]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const letters = settings.brand.split("");

  return (
    <section ref={ref} className="relative flex min-h-screen flex-col overflow-hidden bg-ink-950">
      {/* Background: grid */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-ink-800)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-ink-800)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_78%)]"
      />
      {/* Background: glows */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(255,212,0,0.16),transparent_48%),radial-gradient(circle_at_12%_85%,rgba(124,58,237,0.24),transparent_52%),radial-gradient(circle_at_50%_120%,rgba(139,92,246,0.12),transparent_60%)]"
      />
      {/* Diagonal shapes + parallax layer */}
      <motion.div
        aria-hidden
        style={reduceMotion ? undefined : { y: yBg }}
        className="absolute inset-0"
      >
        <div className="absolute -right-24 top-24 h-72 w-72 rotate-12 border-2 border-gold-500/20" />
        <div className="absolute right-[16%] top-[46%] h-5 w-5 rotate-45 bg-gold-400/40" />
        <div className="absolute left-[8%] top-[30%] h-4 w-4 rotate-45 bg-neon-500/50" />
        <div className="absolute bottom-[28%] left-[22%] h-2 w-24 rotate-[-24deg] bg-gold-500/30" />
        <div className="absolute bottom-[12%] right-[28%] h-px w-40 -rotate-12 bg-gold-500/40" />
      </motion.div>

      {/* Content */}
      <motion.div
        style={reduceMotion ? undefined : { y: yContent, opacity }}
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-32 text-center sm:px-6"
      >
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 text-kicker uppercase text-gold-400"
        >
          {settings.hero.kicker}
        </motion.p>

        <h1
          className="flex flex-wrap justify-center font-display text-display uppercase leading-[0.95] tracking-tight text-paper-50"
          aria-label={settings.brand}
        >
          {letters.slice(0, -3).map((char, i) => (
            <motion.span
              key={`${char}-${i}`}
              aria-hidden
              className={char === " " ? "w-[0.3em]" : undefined}
              initial={{ opacity: 0, y: 70, rotateX: 70 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.3 + i * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {char}
            </motion.span>
          ))}
          <motion.span
            aria-hidden
            className="[-webkit-text-stroke:2px_var(--color-gold-400)] text-transparent"
            initial={{ opacity: 0, y: 70, rotateX: 70 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{
              duration: 0.8,
delay: 0.3 + (letters.length - 3) * 0.06,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {letters.slice(-3).join("")}
          </motion.span>
        </h1>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7 h-1.5 w-24 rounded-full bg-gold-400 shadow-gold"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7 max-w-xl text-balance text-base text-paper-200/90 sm:text-lg"
        >
          {settings.hero.tagline} {settings.hero.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Button as={Link} href="#featured" variant="primary" size="lg">
            Explore
          </Button>
          <Button as={Link} href="/about" variant="outline" size="lg">
            About Me
          </Button>
          <div className="flex w-full items-center justify-center gap-4 text-xs font-medium uppercase tracking-widest text-ink-400 sm:hidden">
            <Link href="/community" className="transition-colors hover:text-gold-400">
              Community
            </Link>
            <span aria-hidden className="text-ink-700">
              ·
            </span>
            <Link href="/store" className="transition-colors hover:text-gold-400">
              Store
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* Ticker marquee */}
      <div
        aria-hidden
        className="relative z-10 border-t border-ink-800 bg-ink-950/60 py-4 backdrop-blur-sm"
      >
        <div className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="flex items-center gap-8 text-h3 font-display uppercase text-ink-400"
            >
              {item}
              <span className="h-2 w-2 rotate-45 bg-gold-400/70" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
