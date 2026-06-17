import { cn } from "@/lib/utils";

export interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  className?: string;
  barClassName?: string;
  valueFormatter?: (n: number) => string;
  /** Render the formatted value above each bar */
  showValues?: boolean;
}

/**
 * CSS-based vertical bar chart — crisp, responsive, dependency-free.
 */
export function BarChart({
  data,
  height = 200,
  className,
  barClassName,
  valueFormatter = (n) => `${n}`,
  showValues = false,
}: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value)) || 1;

  return (
    <div className={className}>
      <div className="flex items-end justify-between gap-3" style={{ height }}>
        {data.map((d) => {
          const pct = Math.max((d.value / max) * 100, 3);
          return (
            <div key={d.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
              {showValues && (
                <span className="text-[11px] font-semibold text-foreground/70">{valueFormatter(d.value)}</span>
              )}
              <div className="relative flex w-full max-w-12 flex-1 items-end">
                <div
                  title={`${d.label}: ${valueFormatter(d.value)}`}
                  className={cn(
                    "w-full rounded-t-lg bg-gradient-to-t from-brand-500 to-coral-400 transition-all duration-300 group-hover:from-brand-600 group-hover:to-coral-500",
                    barClassName
                  )}
                  style={{ height: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between gap-3">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-[11px] font-medium text-muted-foreground">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
