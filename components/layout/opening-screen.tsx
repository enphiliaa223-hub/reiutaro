"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { OpeningSettings } from "@/lib/settings";

const SESSION_KEY = "reiutaro-opening-seen";

// Kalau tidak berlangganan, subscribe adalah no-op.
const noopSubscribe = () => () => {};

export function OpeningScreen({ settings }: { settings: OpeningSettings }) {
  const pending = useSyncExternalStore(noopSubscribe, getClientSnapshot, getServerSnapshot);

  function getClientSnapshot() {
    if (typeof window === "undefined") return false;
    try {
      return settings.enabled && !sessionStorage.getItem(SESSION_KEY);
    } catch {
      return settings.enabled;
    }
  }

  function getServerSnapshot() {
    return false;
  }

  const [done, setDone] = useState(false);
  const reduceMotion = useReducedMotion();
  const timerRef = useRef<number | null>(null);

  const show = pending && !done;

  useEffect(() => {
    if (!show) return;
    const delay = reduceMotion ? 500 : settings.duration;
    const t = window.setTimeout(() => end(), delay);
    timerRef.current = t;
    return () => window.clearTimeout(t);
  }, [show, reduceMotion, settings.duration]);

  function end() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // sessionStorage dapat gagal di beberapa mode privasi — abaikan.
    }
    setDone(true);
  }

  const letters = settings.title.split("");

  return (
    <AnimatePresence>
      {show && !done ? (
        <motion.div
          role="status"
          aria-label={`${settings.title} — ${settings.subtitle}`}
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden bg-ink-950"
          exit={{ opacity: 0, scale: 1.06 }}
          transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* Background: grid + glow + shapes */}
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-ink-800)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-ink-800)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(124,58,237,0.28),transparent_55%),radial-gradient(circle_at_85%_15%,rgba(255,212,0,0.16),transparent_45%),radial-gradient(circle_at_10%_30%,rgba(139,92,246,0.12),transparent_40%)]"
          />
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              aria-hidden
              className="absolute border border-gold-500/25"
              style={{
                width: 40 + i * 26,
                height: 40 + i * 26,
                top: `${24 + i * 18}%`,
                left: `${10 + i * 14}%`,
              }}
              animate={{ rotate: [0, 45, 90], y: [0, -16, 0] }}
              transition={{
                duration: 7 + i,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Judul */}
          <div className="relative flex flex-col items-center px-4 text-center">
            <motion.p
              className="mb-6 text-kicker uppercase text-gold-400"
              initial={{ opacity: 0, letterSpacing: "0.6em" }}
              animate={{ opacity: 1, letterSpacing: "0.22em" }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {settings.subtitle}
            </motion.p>

            <h1
              className="flex select-none font-display text-[clamp(3rem,12vw,9rem)] uppercase leading-none text-paper-50"
              aria-label={settings.title}
            >
              {letters.map((char, i) => (
                <motion.span
                  key={`${char}-${i}`}
                  aria-hidden
                  className={char === " " ? "w-[0.35em]" : undefined}
                  initial={{ opacity: 0, y: 60, rotateX: 90 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{
                    duration: 0.7,
                    delay: 0.45 + i * 0.09,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </h1>

            <motion.div
              aria-hidden
              className="mt-6 h-1.5 w-14 rounded-full bg-gold-400 shadow-gold"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          {/* Progress bar */}
          {!reduceMotion ? (
            <motion.div
              aria-hidden
              className="absolute bottom-0 left-0 h-[3px] origin-left bg-gold-400"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: settings.duration / 1000, ease: "linear" }}
            />
          ) : null}

          {settings.showSkip ? (
            <motion.button
              type="button"
              onClick={end}
              className="absolute right-6 top-6 z-10 rounded-md border border-ink-600 px-4 py-2 text-xs font-medium uppercase tracking-widest text-paper-200 transition-colors duration-200 hover:border-gold-400 hover:text-gold-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Skip
            </motion.button>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
