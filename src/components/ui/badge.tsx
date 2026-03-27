import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "outline";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-950 text-white",
  secondary: "bg-slate-100 text-slate-700",
  success:
    "bg-emerald-500/12 text-emerald-700 ring-1 ring-inset ring-emerald-500/18",
  warning:
    "bg-amber-500/12 text-amber-700 ring-1 ring-inset ring-amber-500/18",
  danger:
    "bg-rose-500/12 text-rose-700 ring-1 ring-inset ring-rose-500/18",
  outline: "bg-white/55 text-slate-600 ring-1 ring-inset ring-slate-300/75",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
