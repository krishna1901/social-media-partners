"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";

type AnimatedCounterProps = {
  value: number;
  /** Seconds the count-up takes. */
  duration?: number;
  /** Decimal places to render. Defaults to the target value's own precision. */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

/** Decimal places in a number's plain representation (capped at 4). */
function precisionOf(n: number): number {
  if (Number.isInteger(n)) return 0;
  const s = String(n);
  const i = s.indexOf(".");
  return i === -1 ? 0 : Math.min(4, s.length - i - 1);
}

/**
 * Counts up from 0 to `value` on mount, and animates to the new value whenever
 * `value` changes. SSR-safe: server and client both render the starting value
 * (0, or the final value under reduced motion), so there's no hydration
 * mismatch. Decimal precision defaults to the target value's own precision so
 * integer stats stay integers and fractional stats keep their decimals.
 */
export function AnimatedCounter({
  value,
  duration = 1.1,
  decimals,
  prefix = "",
  suffix = "",
  className,
}: AnimatedCounterProps) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    // Reduced motion → `duration: 0` snaps to the value with no visible motion.
    // `display` is never branched on `reduce`, so server and client first paint
    // both render 0 — no hydration mismatch.
    const controls = animate(from.current, value, {
      duration: reduce ? 0 : duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, duration, reduce]);

  const dp = decimals ?? precisionOf(value);
  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
