"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  size?: "sm" | "default";
}

/** Compact view/segment switcher (e.g. Table / Grid / Kanban). */
export function Segmented({ options, value, onValueChange, className, size = "default" }: SegmentedProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-border bg-muted/60 p-1",
        className
      )}
      role="tablist"
    >
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(o.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg font-medium transition-all",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-sm",
              active
                ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {Icon && <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
