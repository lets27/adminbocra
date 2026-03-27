"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpotlightProps {
  className?: string;
  fill?: string;
}

export function Spotlight({
  className,
  fill = "rgba(20, 184, 166, 0.24)",
}: SpotlightProps) {
  return (
    <motion.div
      animate={{
        opacity: [0.4, 0.72, 0.4],
        scale: [1, 1.04, 1],
      }}
      className={cn("pointer-events-none absolute rounded-full blur-3xl", className)}
      style={{
        background: `radial-gradient(circle, ${fill} 0%, rgba(20,184,166,0.06) 42%, transparent 72%)`,
      }}
      transition={{
        duration: 8,
        ease: "easeInOut",
        repeat: Number.POSITIVE_INFINITY,
      }}
    />
  );
}
