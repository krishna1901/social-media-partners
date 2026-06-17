import { Eye, TrendingUp } from "lucide-react";
import type { Platform, PostStatus, PostType } from "@/lib/demo-data";
import { PlatformStack } from "@/components/ui/platform-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { ContentTypeBadge } from "@/components/ui/content-type-badge";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface PostCardData {
  id: string;
  title: string;
  excerpt: string;
  platforms: Platform[];
  type: PostType;
  status: PostStatus;
  date: string;
  author: string;
  reach?: string;
  engagement?: string;
}

export function PostCard({
  post,
  onClick,
  className,
}: {
  post: PostCardData;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <PlatformStack platforms={post.platforms} />
        <StatusBadge status={post.status} />
      </div>
      <div>
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground group-hover:text-brand-600">{post.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{post.excerpt}</p>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <ContentTypeBadge type={post.type} />
          <span className="text-[11px] text-muted-foreground">{post.date}</span>
        </div>
        {post.reach ? (
          <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{post.reach}</span>
            {post.engagement && <span className="inline-flex items-center gap-1 text-emerald-600"><TrendingUp className="h-3 w-3" />{post.engagement}</span>}
          </div>
        ) : (
          <Avatar initials={post.author.split(" ").map((p) => p[0]).join("").slice(0, 2)} size="xs" gradient="from-slate-400 to-slate-600" />
        )}
      </div>
    </button>
  );
}
