"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
};

/**
 * Scroll-triggered entrance for long marketing pages. Animates once when it
 * scrolls into view. Honors `prefers-reduced-motion`.
 */
export function Reveal({ delay = 0, y = 24, className, children, ...props }: RevealProps) {
  const reduce = useReducedMotion();
  // Identical `initial` on server/client (not branched on `reduce`) to avoid a
  // hydration mismatch; reduced motion snaps in with `duration: 0`.
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: reduce ? 0 : 0.55, delay: reduce ? 0 : delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
