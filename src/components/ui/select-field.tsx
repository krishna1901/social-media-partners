import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectFieldProps
  extends Omit<React.ComponentProps<"select">, "children"> {
  options: (string | { value: string; label: string })[];
  placeholder?: string;
  /** Optional small leading label rendered inside the control row */
  selectClassName?: string;
}

/**
 * Premium-styled native <select>. Reliable, accessible, and consistent with
 * the design system — used across Phase 1 demo pages for tone/platform/etc.
 */
export function SelectField({
  options,
  placeholder,
  className,
  selectClassName,
  ...props
}: SelectFieldProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        className={cn(
          "h-9 w-full appearance-none rounded-lg border border-input bg-card pl-3 pr-9 text-sm font-medium text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
          selectClassName
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => {
          const value = typeof o === "string" ? o : o.value;
          const label = typeof o === "string" ? o : o.label;
          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
