import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-2xl border border-white/75 bg-white/75 px-4 py-2 text-sm text-slate-950 shadow-[0_12px_24px_rgba(15,23,42,0.05)] outline-none placeholder:text-slate-400 focus:border-teal-500/50 focus:bg-white focus:ring-4 focus:ring-teal-500/10",
        className,
      )}
      type={type}
      {...props}
    />
  );
}
