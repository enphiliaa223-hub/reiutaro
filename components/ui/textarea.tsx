import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, required, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const textareaId = id ?? autoId;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={textareaId} className="text-sm font-medium text-paper-200">
          {label}
          {required ? <span className="text-gold-400"> *</span> : null}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        required={required}
        aria-invalid={error ? true : undefined}
        rows={4}
        className={cn(
          "w-full rounded-lg border bg-ink-900 px-3.5 py-3 text-sm text-paper-50",
          "placeholder:text-ink-500 transition-colors duration-200 resize-y",
          "focus:outline-none focus:ring-2",
          error
            ? "border-danger/60 focus:border-danger focus:ring-danger/30"
            : "border-ink-700 focus:border-gold-400 focus:ring-gold-400/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
});
Textarea.displayName = "Textarea";
