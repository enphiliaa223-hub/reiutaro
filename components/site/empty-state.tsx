import { cn } from "@/lib/utils";

export function EmptyState({
  message,
  hint,
  className,
}: {
  message: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-700 px-6 py-14 text-center",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-8 w-8 text-ink-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M9 4v16" strokeLinecap="round" />
      </svg>
      <p className="text-sm text-paper-200">{message}</p>
      {hint ? <p className="text-xs text-ink-400">{hint}</p> : null}
    </div>
  );
}
