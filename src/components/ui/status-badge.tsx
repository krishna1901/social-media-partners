import { cn } from "@/lib/utils";

type Tone = "neutral" | "brand" | "info" | "success" | "warning" | "danger" | "purple" | "teal";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-muted text-foreground/70 border-border",
  brand: "bg-brand-50 text-brand-700 border-brand-200",
  info: "bg-sky-50 text-sky-700 border-sky-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  purple: "bg-violet-50 text-violet-700 border-violet-200",
  teal: "bg-teal-50 text-teal-700 border-teal-200",
};

// Maps every status string used across the app to a tone + display label.
const statusMap: Record<string, { tone: Tone; label?: string }> = {
  // content lifecycle
  idea: { tone: "purple" },
  draft: { tone: "neutral" },
  ready: { tone: "info" },
  scheduled: { tone: "warning" },
  posted: { tone: "success" },
  published: { tone: "success", label: "Posted" },
  failed: { tone: "danger" },
  cancelled: { tone: "neutral" },
  queued: { tone: "warning" },
  processing: { tone: "info" },
  // inbox
  new: { tone: "brand" },
  replied: { tone: "success" },
  ignored: { tone: "neutral" },
  // integrations / channels
  connected: { tone: "success" },
  available: { tone: "neutral", label: "Not connected" },
  error: { tone: "danger" },
  active: { tone: "success" },
  inactive: { tone: "neutral" },
  // sentiment
  positive: { tone: "success" },
  neutral: { tone: "neutral" },
  negative: { tone: "danger" },
  // momentum
  rising: { tone: "success" },
  peaking: { tone: "warning" },
  steady: { tone: "info" },
  // automation log
  success: { tone: "success" },
  pending: { tone: "warning" },
  skipped: { tone: "neutral" },
  dry_run: { tone: "info", label: "Dry run" },
};

export function StatusBadge({
  status,
  className,
  withDot = false,
}: {
  status: string;
  className?: string;
  withDot?: boolean;
}) {
  const entry = statusMap[status.toLowerCase()] ?? { tone: "neutral" as Tone };
  const label = entry.label ?? status;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize tracking-wide",
        toneClasses[entry.tone],
        className
      )}
    >
      {withDot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {label}
    </span>
  );
}
