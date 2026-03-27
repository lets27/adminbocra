import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
}

export function Progress({ className, value, ...props }: ProgressProps) {
  return (
    <div
      className={cn("h-2.5 overflow-hidden rounded-full bg-slate-200", className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a_0%,#14b8a6_65%,#f59e0b_100%)] transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
