import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "default" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-[linear-gradient(135deg,#0f172a_0%,#17345c_65%,#0f766e_100%)] text-white shadow-[0_18px_44px_rgba(15,23,42,0.22)] hover:brightness-105",
  secondary:
    "bg-white/80 text-slate-900 ring-1 ring-inset ring-white/80 shadow-[0_12px_30px_rgba(148,163,184,0.16)] hover:bg-white",
  outline:
    "bg-transparent text-slate-700 ring-1 ring-inset ring-slate-300/70 hover:bg-white/70 hover:text-slate-950",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-950/5 hover:text-slate-950",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 rounded-xl px-3.5 text-xs font-semibold",
  default: "h-11 rounded-2xl px-5 text-sm font-semibold",
  lg: "h-12 rounded-[1.15rem] px-6 text-sm font-semibold",
  icon: "size-11 rounded-2xl p-0",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap transition duration-200 ease-out disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
