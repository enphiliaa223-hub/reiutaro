import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "outline" | "ghost" | "paper" | "danger" | "neon";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export const buttonStyles = ({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-wide transition-all duration-200 select-none",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400",
    "disabled:pointer-events-none disabled:opacity-40",
    "cursor-pointer",
    {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-6 text-sm",
      lg: "h-13 px-8 text-base",
      icon: "h-10 w-10",
    }[size],
    {
      primary:
        "bg-gold-400 text-ink-950 font-semibold shadow-gold hover:bg-gold-300 active:scale-[0.98]",
      outline:
        "border border-ink-600 text-paper-50 hover:border-gold-400 hover:text-gold-400 active:scale-[0.98]",
      ghost: "text-paper-200 hover:bg-ink-800 hover:text-gold-400 active:scale-[0.98]",
      paper: "bg-paper-50 text-ink-950 font-semibold hover:bg-gold-400 active:scale-[0.98]",
      danger:
        "bg-danger/10 text-danger border border-danger/30 hover:bg-danger hover:text-white active:scale-[0.98]",
      neon: "bg-neon-600 text-white font-semibold hover:bg-neon-500 active:scale-[0.98]",
    }[variant],
    className,
  );

export interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export type ButtonProps = ButtonOwnProps;

export type PolymorphicButtonProps<C extends ElementType> = {
  as?: C;
} & ButtonOwnProps &
  ComponentPropsWithoutRef<C>;

/** Tombol polymorphic: render <a>/<Link> saat `as` diberikan. */
export function Button<C extends ElementType = "button">({
  as,
  variant,
  size,
  className,
  type,
  ...props
}: PolymorphicButtonProps<C>) {
  const Component = as ?? "button";
  const buttonType = Component === "button" ? (type ?? "button") : undefined;
  return (
    <Component
      type={buttonType}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}
