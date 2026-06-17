import { cn } from "@/lib/utils";

type Tone = "brand" | "success" | "warning" | "info" | "neutral";

const toneStyles: Record<Tone, { ring: string; icon: string; chip: string }> = {
  brand: { ring: "ring-brand-200 bg-brand-50/50", icon: "bg-brand-500 text-white", chip: "bg-brand-100 text-brand-700" },
  success: { ring: "ring-emerald-200 bg-emerald-50/50", icon: "bg-emerald-500 text-white", chip: "bg-emerald-100 text-emerald-700" },
  warning: { ring: "ring-amber-200 bg-amber-50/50", icon: "bg-amber-500 text-white", chip: "bg-amber-100 text-amber-700" },
  info: { ring: "ring-sky-200 bg-sky-50/50", icon: "bg-sky-500 text-white", chip: "bg-sky-100 text-sky-700" },
  neutral: { ring: "ring-border bg-muted/40", icon: "bg-foreground text-background", chip: "bg-muted text-foreground/70" },
};

interface InsightCardProps {
  title: string;
  body: string;
  icon?: React.ReactNode;
  tone?: Tone;
  impact?: string;
  action?: React.ReactNode;
  className?: string;
}

export function InsightCard({ title, body, icon, tone = "brand", impact, action, className }: InsightCardProps) {
  const s = toneStyles[tone];
  return (
    <div className={cn("rounded-2xl p-4 ring-1", s.ring, className)}>
      <div className="flex items-start gap-3">
        {icon && <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm", s.icon)}>{icon}</div>}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {impact && <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", s.chip)}>{impact}</span>}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  );
}
