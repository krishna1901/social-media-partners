import { ImageIcon, Video, FileArchive, Layers, Play, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MediaAssetData {
  id: string;
  name: string;
  kind: "image" | "video" | "zip" | "thumbnail" | "carousel";
  size: string;
  dimensions?: string;
  updated: string;
  linkedPost?: string;
  gradient: string;
}

const kindMeta = {
  image: { label: "Image", icon: ImageIcon },
  thumbnail: { label: "Thumbnail", icon: ImageIcon },
  video: { label: "Video", icon: Video },
  zip: { label: "ZIP", icon: FileArchive },
  carousel: { label: "Carousel", icon: Layers },
};

export function MediaCard({
  asset,
  onClick,
  className,
}: {
  asset: MediaAssetData;
  onClick?: () => void;
  className?: string;
}) {
  const meta = kindMeta[asset.kind];
  const I = meta.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      <div className={cn("relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br", asset.gradient)}>
        <I className="h-9 w-9 text-white/90" />
        {asset.kind === "video" && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm">
              <Play className="h-4 w-4 fill-white text-white" />
            </span>
          </span>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
          {meta.label}
        </span>
      </div>
      <div className="space-y-1.5 p-3">
        <p className="line-clamp-1 text-xs font-semibold text-foreground">{asset.name}</p>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{asset.size}{asset.dimensions ? ` · ${asset.dimensions}` : ""}</span>
          <span>{asset.updated}</span>
        </div>
        {asset.linkedPost && (
          <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground/60">
            <Link2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{asset.linkedPost}</span>
          </span>
        )}
      </div>
    </button>
  );
}
