"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type OrbProps = {
  className?: string;
  /** Tailwind gradient/color classes for the orb body. */
  color?: string;
  /** Drift distance in px. */
  drift?: number;
  /** Seconds per float cycle. */
  duration?: number;
  delay?: number;
};

/**
 * A soft, slowly-drifting blurred orb for hero / auth backgrounds. Purely
 * decorative (pointer-events: none). Static when reduced motion is requested.
 */
export function GradientOrb({
  className,
  color = "bg-brand-500/25",
  drift = 30,
  duration = 14,
  delay = 0,
}: OrbProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      animate={
        reduce
          ? undefined
          : { x: [0, drift, 0], y: [0, -drift, 0], scale: [1, 1.08, 1] }
      }
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
      className={cn(
        "pointer-events-none absolute rounded-full blur-3xl",
        color,
        className
      )}
    />
  );
}

/**
 * Layered animated aurora background. Drop into a `relative overflow-hidden`
 * container as the first child.
 */
export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <GradientOrb className="-left-24 -top-24 h-72 w-72" color="bg-brand-500/25" duration={16} />
      <GradientOrb className="right-0 top-1/3 h-80 w-80" color="bg-coral-500/20" duration={20} delay={1.5} />
      <GradientOrb className="bottom-0 left-1/3 h-72 w-72" color="bg-violet-500/15" duration={18} delay={0.8} />
    </div>
  );
}
