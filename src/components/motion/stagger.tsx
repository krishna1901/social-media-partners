"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

type StaggerProps = HTMLMotionProps<"div"> & {
  /** Seconds between each child's entrance. */
  stagger?: number;
  /** Seconds before the first child animates. */
  delay?: number;
};

/**
 * Container that cascades its `StaggerItem` children into view. Wrap grids and
 * lists (stat cards, channel cards, tool grids). Server pages can render this
 * around server-fetched children — only the wrapper is client.
 */
export function Stagger({
  stagger = 0.06,
  delay = 0,
  className,
  children,
  ...props
}: StaggerProps) {
  const reduce = useReducedMotion();
  // `initial="hidden"` on both server and client (not branched on `reduce`) so
  // there's no hydration mismatch; reduced motion zeroes the cascade timing.
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: reduce ? 0 : stagger,
            delayChildren: reduce ? 0 : delay,
          },
        },
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type StaggerItemProps = HTMLMotionProps<"div"> & {
  /** Initial vertical offset in px. */
  y?: number;
};

export function StaggerItem({ y = 14, className, children, ...props }: StaggerItemProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] } },
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
