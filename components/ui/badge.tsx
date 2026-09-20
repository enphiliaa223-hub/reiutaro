import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "gold" | "ink" | "neon" | "outline" | "danger" | "success";

export function Badge({
  variant = "gold",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-kicker uppercase",
        {
          gold: "bg-gold-400 text-ink-950",
          ink: "bg-ink-800 text-paper-100",
          neon: "bg-neon-600/15 text-neon-300 border border-neon-600/30",
          outline: "border border-ink-600 text-paper-200",
          danger: "bg-danger/10 text-danger border border-danger/30",
          success: "bg-success/10 text-success border border-success/30",
        }[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
