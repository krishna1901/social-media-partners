import { Calendar, MessageSquare, Sparkles, Check, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ActivityKind = "scheduled" | "comment" | "ai" | "approved" | "integration";

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
  kind: ActivityKind;
  note?: string;
}

const kindMeta: Record<ActivityKind, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  scheduled: { icon: Calendar, color: "bg-amber-100 text-amber-600" },
  comment: { icon: MessageSquare, color: "bg-sky-100 text-sky-600" },
  ai: { icon: Sparkles, color: "bg-brand-100 text-brand-600" },
  approved: { icon: Check, color: "bg-emerald-100 text-emerald-600" },
  integration: { icon: Link2, color: "bg-violet-100 text-violet-600" },
};

export function ActivityFeed({ items, className }: { items: ActivityItem[]; className?: string }) {
  return (
    <ul className={cn("space-y-5", className)}>
      {items.map((item, i) => {
        const meta = kindMeta[item.kind];
        const I = meta.icon;
        const last = i === items.length - 1;
        return (
          <li key={item.id} className="relative flex gap-3">
            {!last && <span className="absolute left-[15px] top-9 bottom-[-1.25rem] w-px bg-border" />}
            <span className={cn("z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card", meta.color)}>
              <I className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm text-foreground">
                <span className="font-semibold">{item.actor}</span>{" "}
                <span className="text-muted-foreground">{item.action}</span>{" "}
                <span className="font-medium">{item.target}</span>
              </p>
              {item.note && (
                <p className="mt-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs italic text-muted-foreground">
                  “{item.note}”
                </p>
              )}
              <p className="mt-1 text-[11px] text-muted-foreground">{item.time}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
