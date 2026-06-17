import type { Platform } from "@/lib/demo-data";
import { Avatar } from "@/components/ui/avatar";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { cn } from "@/lib/utils";

export interface InboxThreadData {
  id: string;
  author: string;
  handle: string;
  initials: string;
  platform: Platform;
  type: "comment" | "dm" | "mention";
  preview: string;
  time: string;
  status: "new" | "replied" | "ignored";
  sentiment: "positive" | "neutral" | "negative";
  relatedPost?: string;
  suggestedReply?: string;
}

const sentimentDot = {
  positive: "bg-emerald-500",
  neutral: "bg-slate-400",
  negative: "bg-red-500",
};

const typeLabel = { comment: "Comment", dm: "DM", mention: "Mention" };

export function InboxThread({
  thread,
  selected,
  onClick,
  className,
}: {
  thread: InboxThreadData;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 border-l-2 px-4 py-3 text-left transition-colors",
        selected ? "border-l-brand-500 bg-brand-50/40" : "border-l-transparent hover:bg-muted/50",
        className
      )}
    >
      <div className="relative">
        <Avatar initials={thread.initials} gradient="from-slate-400 to-slate-600" />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-card text-foreground/70 ring-1 ring-border">
          <PlatformIcon platform={thread.platform} className="h-2.5 w-2.5" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground">
            {thread.author}
            {thread.status === "new" && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
          </span>
          <span className="shrink-0 text-[11px] text-muted-foreground">{thread.time}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={cn("h-1.5 w-1.5 rounded-full", sentimentDot[thread.sentiment])} />
          {typeLabel[thread.type]}
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{thread.preview}</p>
      </div>
    </button>
  );
}
