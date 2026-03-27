"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BackgroundLinesProps {
  className?: string;
  children: React.ReactNode;
}

export function BackgroundLines({
  className,
  children,
}: BackgroundLinesProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-white/12 bg-[linear-gradient(135deg,#081325_0%,#102443_46%,#0f4c5c_72%,#0d7b7b_100%)] text-white shadow-[0_36px_100px_rgba(8,15,33,0.24)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-55 [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:54px_54px]" />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-45"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 1200 600"
      >
        {[0, 1, 2, 3].map((index) => (
          <motion.path
            animate={{ pathLength: [0.2, 1, 0.2], opacity: [0.2, 0.5, 0.2] }}
            d={`M-20 ${100 + index * 110} C 220 ${index * 30}, 420 ${260 + index * 18}, 1220 ${60 + index * 80}`}
            key={index}
            stroke="url(#dashboard-line-gradient)"
            strokeWidth="1.3"
            transition={{
              delay: index * 0.6,
              duration: 9,
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
            }}
          />
        ))}
        <defs>
          <linearGradient id="dashboard-line-gradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="45%" stopColor="rgba(255,255,255,0.8)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="relative">{children}</div>
    </div>
  );
}
