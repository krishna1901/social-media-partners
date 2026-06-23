"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

type MotionCardProps = HTMLMotionProps<"div"> & {
  /** Enable hover lift + tap press micro-interaction. */
  interactive?: boolean;
  /** Optional entrance fade-in on mount. */
  enter?: boolean;
  delay?: number;
};

/**
 * A premium surface with a hover-lift / tap-press micro-interaction. Use for
 * clickable tiles and feature cards. Pair with existing card styling via
 * `className`. Honors `prefers-reduced-motion`.
 */
export function MotionCard({
  interactive = true,
  enter = false,
  delay = 0,
  className,
  children,
  ...props
}: MotionCardProps) {
  const reduce = useReducedMotion();
  // Hover/tap are client-only interactions (safe to branch on `reduce`); the
  // entrance `initial` is not branched on `reduce` so server/client agree.
  const hover = interactive && !reduce ? { y: -4, transition: { duration: 0.2 } } : undefined;
  const tap = interactive && !reduce ? { scale: 0.985 } : undefined;
  return (
    <motion.div
      initial={enter ? { opacity: 0, y: 12 } : false}
      animate={enter ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={hover}
      whileTap={tap}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
