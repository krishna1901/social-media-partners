import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Circle,
  MinusCircle,
  type LucideIcon,
} from "lucide-react";
import type { HealthItem, HealthStatus, ChecklistItem, ChecklistStatus } from "@/lib/admin/health";
import { cn } from "@/lib/utils";

const HEALTH_META: Record<HealthStatus, { label: string; icon: LucideIcon; pill: string; icv: string }> = {
  healthy: { label: "Healthy", icon: CheckCircle2, pill: "bg-emerald-50 text-emerald-700 ring-emerald-100", icv: "text-emerald-500" },
  configured: { label: "Configured", icon: CheckCircle2, pill: "bg-emerald-50 text-emerald-700 ring-emerald-100", icv: "text-emerald-500" },
  missing: { label: "Missing", icon: MinusCircle, pill: "bg-amber-50 text-amber-700 ring-amber-100", icv: "text-amber-500" },
  warn: { label: "Attention", icon: AlertTriangle, pill: "bg-amber-50 text-amber-700 ring-amber-100", icv: "text-amber-500" },
  error: { label: "Error", icon: XCircle, pill: "bg-red-50 text-red-700 ring-red-100", icv: "text-red-500" },
};

export function HealthBadge({ status }: { status: HealthStatus }) {
  const m = HEALTH_META[status];
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", m.pill)}>
      <Icon className="h-3.5 w-3.5" />
      {m.label}
    </span>
  );
}

export function HealthItemRow({ item }: { item: HealthItem }) {
  const m = HEALTH_META[item.status];
  const Icon = m.icon;
  return (
    <li className="flex items-start justify-between gap-3 px-5 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", m.icv)} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {item.label}
            {item.optional && <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">optional</span>}
          </p>
          {item.detail && <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>}
        </div>
      </div>
      <HealthBadge status={item.status} />
    </li>
  );
}

const CHECK_META: Record<ChecklistStatus, { icon: LucideIcon; icv: string; label: string }> = {
  done: { icon: CheckCircle2, icv: "text-emerald-500", label: "Done" },
  todo: { icon: Circle, icv: "text-amber-500", label: "To do" },
  manual: { icon: AlertTriangle, icv: "text-sky-500", label: "Verify" },
};

export function ChecklistRow({ item }: { item: ChecklistItem }) {
  const m = CHECK_META[item.status];
  const Icon = m.icon;
  return (
    <li className="flex items-start gap-3 px-5 py-3">
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", m.icv)} />
      <div className="min-w-0">
        <p className={cn("text-sm font-medium", item.status === "done" ? "text-foreground" : "text-foreground")}>
          {item.label}
          <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{m.label}</span>
        </p>
        {item.detail && <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>}
      </div>
    </li>
  );
}
