import { useId } from "react";

export interface AreaChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  className?: string;
  showGrid?: boolean;
  showDots?: boolean;
  valueFormatter?: (n: number) => string;
}

/**
 * Lightweight, dependency-free smooth area chart (SVG). Demo-data driven.
 * Scales responsively while keeping the stroke crisp via non-scaling-stroke.
 */
export function AreaChart({
  data,
  height = 220,
  color = "var(--chart-1)",
  className,
  showGrid = true,
  showDots = true,
  valueFormatter = (n) => `${n}`,
}: AreaChartProps) {
  const id = useId().replace(/:/g, "");
  const W = 600;
  const H = height;
  const padX = 8;
  const padTop = 16;
  const padBottom = 8;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;

  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = data.length === 1 ? W / 2 : padX + (i / (data.length - 1)) * innerW;
    const y = padTop + innerH - ((d.value - min) / range) * innerH;
    return { x, y };
  });

  // Smooth (cardinal-ish) path
  const linePath = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`;
    })
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${H - padBottom} L ${points[0].x} ${H - padBottom} Z`;

  const gridLines = [0.25, 0.5, 0.75];

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        preserveAspectRatio="none"
        role="img"
        aria-label="Area chart"
      >
        <defs>
          <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {showGrid &&
          gridLines.map((g) => (
            <line
              key={g}
              x1={padX}
              x2={W - padX}
              y1={padTop + innerH * g}
              y2={padTop + innerH * g}
              stroke="var(--border)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

        <path d={areaPath} fill={`url(#area-${id})`} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {showDots &&
          points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="white" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
              <title>{`${data[i].label}: ${valueFormatter(data[i].value)}`}</title>
            </g>
          ))}
      </svg>
      <div className="mt-2 flex justify-between px-1 text-[11px] font-medium text-muted-foreground">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}
