import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />
  );
}

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  id?: string;
  padded?: boolean;
}

export function Section({ id, padded = true, className, ...props }: SectionProps) {
  return (
    <section id={id} className={cn(padded && "py-16 sm:py-24 lg:py-28", className)} {...props} />
  );
}
