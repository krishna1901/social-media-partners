import { GalleryHorizontalEnd, ImageIcon, Video, Type, Film, Circle } from "lucide-react";
import type { PostType } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const typeMeta: Record<PostType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  carousel: { label: "Carousel", icon: GalleryHorizontalEnd },
  image: { label: "Image", icon: ImageIcon },
  video: { label: "Video", icon: Video },
  text: { label: "Text", icon: Type },
  reel: { label: "Reel", icon: Film },
  story: { label: "Story", icon: Circle },
};

export function ContentTypeBadge({ type, className }: { type: PostType; className?: string }) {
  const meta = typeMeta[type];
  const I = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground/70", className)}>
      <I className="h-3 w-3" />
      {meta.label}
    </span>
  );
}
