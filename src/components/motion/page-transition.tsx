"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Wraps route content and re-animates on pathname change — a lightweight,
 * layout-shift-free page transition that replaces the `key={pathname}` +
 * `animate-rise` pattern. Honors `prefers-reduced-motion`.
 */
export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
