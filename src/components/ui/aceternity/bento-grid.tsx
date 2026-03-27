"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function BentoGrid({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("grid gap-5 md:grid-cols-2 xl:grid-cols-4", className)}
      {...props}
    />
  );
}

type BentoCardProps = React.PropsWithChildren<{
  className?: string;
  eyebrow?: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
}>;

export function BentoCard({
  className,
  eyebrow,
  title,
  description,
  icon,
  children,
}: BentoCardProps) {
  return (
    <motion.div
      className={cn(
        "group relative overflow-hidden rounded-[1.75rem] border border-white/65 bg-white/85 p-5 shadow-[0_20px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl",
        className,
      )}
      initial={false}
      transition={{ duration: 0.2, ease: "easeOut" }}
      whileHover={{ translateY: -4 }}
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(20,184,166,0.65),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {eyebrow}
            </p>
          ) : null}
          <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
            {title}
          </h3>
          <p className="text-sm leading-6 text-slate-500">{description}</p>
        </div>
        {icon ? (
          <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_16px_34px_rgba(15,23,42,0.18)]">
            {icon}
          </div>
        ) : null}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </motion.div>
  );
}
