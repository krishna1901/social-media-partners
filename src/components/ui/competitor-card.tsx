import { ExternalLink, Eye } from "lucide-react";
import type { Platform, PostType } from "@/lib/demo-data";
import { Avatar } from "@/components/ui/avatar";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { ContentTypeBadge } from "@/components/ui/content-type-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CompetitorCardData {
  id: string;
  name: string;
  handle: string;
  initials: string;
  platform: Platform;
  niche: string;
  url: string;
  followers: string;
  postsPerWeek: number;
  avgEngagement: string;
  topFormat: PostType;
  gradient: string;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/50 p-2.5 text-center">
      <div className="text-sm font-bold text-foreground">{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

export function CompetitorCard({ competitor, className }: { competitor: CompetitorCardData; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar initials={competitor.initials} gradient={competitor.gradient} size="lg" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">{competitor.name}</h3>
            <p className="text-xs text-muted-foreground">{competitor.handle}</p>
          </div>
        </div>
        <PlatformBadge platform={competitor.platform} showLabel={false} />
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground/70">{competitor.niche}</span>
        <ContentTypeBadge type={competitor.topFormat} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Followers" value={competitor.followers} />
        <Stat label="Posts/wk" value={competitor.postsPerWeek} />
        <Stat label="Avg Eng." value={competitor.avgEngagement} />
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
        <Button size="sm" variant="outline" className="flex-1">
          <Eye className="h-3.5 w-3.5" /> View posts
        </Button>
        <Button size="sm" variant="ghost" className="text-muted-foreground">
          <ExternalLink className="h-3.5 w-3.5" /> Profile
        </Button>
      </div>
    </div>
  );
}
