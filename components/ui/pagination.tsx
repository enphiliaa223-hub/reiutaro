"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function buildPageItems(current: number, total: number, siblings = 1) {
  const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const start = Math.max(1, Math.min(current - siblings, total - siblings * 2 - 1));
  const end = Math.min(total, Math.max(current + siblings, start + siblings * 2));

  const pages = range(start, end);
  const items: (number | "ellipsis-start" | "ellipsis-end")[] = [];

  if (start > 1) {
    items.push(1);
    if (start > 2) items.push("ellipsis-start");
  }
  pages.forEach((p) => items.push(p));
  if (end < total) {
    if (end < total - 1) items.push("ellipsis-end");
    items.push(total);
  }
  return items;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblings?: number;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  siblings = 1,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const items = buildPageItems(page, totalPages, siblings);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center justify-center gap-2", className)}
    >
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        ←
      </Button>

      {items.map((item, i) => {
        if (item === "ellipsis-start" || item === "ellipsis-end") {
          return (
            <span key={`${item}-${i}`} aria-hidden className="px-1 text-sm text-ink-500">
              …
            </span>
          );
        }
        const isCurrent = item === page;
        return (
          <button
            key={item}
            type="button"
            aria-current={isCurrent ? "page" : undefined}
            onClick={() => onPageChange(item)}
            className={cn(
              "h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition-colors duration-200",
              isCurrent
                ? "bg-gold-400 text-ink-950 shadow-gold"
                : "text-paper-200 hover:bg-ink-800 hover:text-gold-400",
            )}
          >
            {item}
          </button>
        );
      })}

      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        →
      </Button>
    </nav>
  );
}
