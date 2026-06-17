import { Flame, Lightbulb, PenSquare, MoreHorizontal } from "lucide-react";
import type { Platform } from "@/lib/demo-data";
import { PlatformChip } from "@/components/ui/platform-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TrendCardData {
  id: string;
  tag: string;
  category: string;
  relevance: number;
  growth: string;
  momentum: "rising" | "peaking" | "steady";
  platform: Platform;
  source: string;
  note: string;
}

export function TrendCard({ trend, className }: { trend: TrendCardData; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <PlatformChip platform={trend.platform} />
          <StatusBadge status={trend.momentum} withDot />
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
          <Flame className="h-3 w-3" />
          {trend.growth}
        </span>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">{trend.tag}</h3>
        <p className="text-[11px] font-medium text-muted-foreground">{trend.category} · via {trend.source}</p>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span>Relevance</span>
          <span className="font-semibold text-foreground">{trend.relevance}/100</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-coral-500" style={{ width: `${trend.relevance}%` }} />
        </div>
      </div>

      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{trend.note}</p>

      <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
        <Button size="sm" variant="outline" className="flex-1">
          <Lightbulb className="h-3.5 w-3.5" /> Save as idea
        </Button>
        <Button size="sm" className="flex-1 bg-gradient-to-r from-brand-500 to-coral-500 text-white">
          <PenSquare className="h-3.5 w-3.5" /> Generate post
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="More actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
