"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (args: { type?: ToastType; title: string; message?: string }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastType, ReactNode> = {
  success: (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/20">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-success" fill="none">
        <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </span>
  ),
  error: (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-danger/20">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-danger" fill="none">
        <path
          d="M18 6 6 18M6 6l12 12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  ),
  info: (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-info/20">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-info" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  ),
};

const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>(
    ({ type = "info", title, message }) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev.slice(-4), { id, type, title, message }]);
      setTimeout(() => dismiss(id), DEFAULT_DURATION);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl border bg-ink-900 p-4 shadow-pop",
                {
                  success: "border-success/40",
                  error: "border-danger/40",
                  info: "border-ink-600",
                }[t.type],
              )}
            >
              {icons[t.type]}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-paper-50">{t.title}</p>
                {t.message ? <p className="mt-0.5 text-xs text-ink-300">{t.message}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="text-ink-400 transition-colors hover:text-paper-50"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus dipakai di dalam <ToastProvider>");
  return ctx;
}

/** Convenience: toast sukses/error cepat. */
export function useToastHelpers() {
  const { toast } = useToast();
  return {
    success: (title: string, message?: string) => toast({ type: "success", title, message }),
    error: (title: string, message?: string) => toast({ type: "error", title, message }),
    info: (title: string, message?: string) => toast({ type: "info", title, message }),
  };
}
