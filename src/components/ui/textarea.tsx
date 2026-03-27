import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-[1.3rem] border border-slate-200/80 bg-white/82 px-4 py-3 text-sm text-slate-950 shadow-[0_10px_30px_rgba(148,163,184,0.12)] outline-none transition placeholder:text-slate-400 focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10",
        className,
      )}
      {...props}
    />
  );
}
