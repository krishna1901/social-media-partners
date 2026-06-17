"use client";

import { useMemo, useState } from "react";
import {
  UploadCloud,
  LayoutGrid,
  List as ListIcon,
  ImageIcon,
  Video,
  HardDrive,
  FileArchive,
  Layers,
  Play,
  MoreHorizontal,
  Download,
  Copy,
  Trash2,
  Link2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { FilterBar } from "@/components/ui/filter-bar";
import { SelectField } from "@/components/ui/select-field";
import { MediaCard } from "@/components/ui/media-card";
import { UploadDropzone } from "@/components/ui/upload-dropzone";
import { Segmented } from "@/components/ui/segmented";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mediaAssets, posts } from "@/lib/demo-data";

type MediaAsset = (typeof mediaAssets)[number];

const kindMeta: Record<
  MediaAsset["kind"],
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  image: { label: "Image", icon: ImageIcon },
  thumbnail: { label: "Thumbnail", icon: ImageIcon },
  video: { label: "Video", icon: Video },
  zip: { label: "ZIP", icon: FileArchive },
  carousel: { label: "Carousel", icon: Layers },
};

const typeOptions = ["All types", "Images", "Videos", "ZIPs", "Carousels", "Thumbnails"];
const sortOptions = ["Newest", "Oldest", "Name A-Z", "By type", "By linked post"];

export default function MediaLibraryPage() {
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState<MediaAsset | null>(null);

  const images = mediaAssets.filter((a) => a.kind === "image" || a.kind === "thumbnail").length;
  const videos = mediaAssets.filter((a) => a.kind === "video").length;

  const postTitles = useMemo(
    () => ["No linked post", ...posts.map((p) => p.title)],
    []
  );

  const openPreview = (asset: MediaAsset) => setSelected(asset);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        description="Organize images, videos, ZIPs and carousel assets."
        actions={
          <>
            <Segmented
              value={view}
              onValueChange={setView}
              options={[
                { value: "grid", label: "Grid", icon: LayoutGrid },
                { value: "list", label: "List", icon: ListIcon },
              ]}
            />
            <Button className="bg-gradient-to-r from-brand-500 to-coral-500 text-white shadow-sm shadow-brand-500/20 hover:from-brand-600 hover:to-coral-600">
              <UploadCloud className="h-4 w-4" /> Upload
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total assets"
          value={mediaAssets.length}
          icon={<Layers className="h-4 w-4" />}
          accent="from-brand-500 to-coral-500"
          hint="across all folders"
        />
        <StatCard
          label="Images"
          value={images}
          icon={<ImageIcon className="h-4 w-4" />}
          accent="from-violet-500 to-indigo-500"
          hint="photos & thumbnails"
        />
        <StatCard
          label="Videos"
          value={videos}
          icon={<Video className="h-4 w-4" />}
          accent="from-pink-500 to-rose-500"
          hint="reels & clips"
        />
        <StatCard
          label="Storage used"
          value="1.2 GB"
          icon={<HardDrive className="h-4 w-4" />}
          accent="from-emerald-500 to-teal-500"
          hint="of 5 GB on the Pro plan"
        />
      </div>

      {/* Upload dropzone */}
      <UploadDropzone hint="Images, videos, ZIPs and carousel PNGs up to 200MB · drag a file or browse" />

      {/* Filters */}
      <FilterBar searchPlaceholder="Search assets…">
        <SelectField options={typeOptions} defaultValue="All types" className="w-40" aria-label="Filter by type" />
        <SelectField options={sortOptions} defaultValue="Newest" className="w-44" aria-label="Sort assets" />
      </FilterBar>

      {/* Views */}
      {view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {mediaAssets.map((a) => (
            <MediaCard key={a.id} asset={a} onClick={() => openPreview(a)} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* header row */}
          <div className="hidden items-center gap-4 border-b border-border bg-muted/30 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:flex">
            <span className="w-12" />
            <span className="flex-1">Name</span>
            <span className="w-24">Type</span>
            <span className="w-20">Size</span>
            <span className="hidden w-28 lg:block">Dimensions</span>
            <span className="w-24">Updated</span>
            <span className="hidden w-44 xl:block">Linked post</span>
            <span className="w-9" />
          </div>
          <ul className="divide-y divide-border">
            {mediaAssets.map((a) => {
              const meta = kindMeta[a.kind];
              const I = meta.icon;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => openPreview(a)}
                    className="flex w-full items-center gap-4 px-4 py-2.5 text-left transition-colors hover:bg-muted/40"
                  >
                    <span
                      className={cn(
                        "relative flex h-10 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br text-white",
                        a.gradient
                      )}
                    >
                      <I className="h-4 w-4 text-white/90" />
                      {a.kind === "video" && (
                        <Play className="absolute h-3 w-3 fill-white text-white" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-sm font-semibold text-foreground">{a.name}</span>
                      <span className="text-[11px] text-muted-foreground md:hidden">
                        {meta.label} · {a.size}
                      </span>
                    </span>
                    <span className="hidden w-24 md:block">
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground/70">
                        <I className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </span>
                    <span className="hidden w-20 text-xs text-muted-foreground md:block">{a.size}</span>
                    <span className="hidden w-28 text-xs text-muted-foreground lg:block">{a.dimensions ?? "—"}</span>
                    <span className="hidden w-24 text-xs text-muted-foreground md:block">{a.updated}</span>
                    <span className="hidden w-44 xl:block">
                      {a.linkedPost ? (
                        <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground/60">
                          <Link2 className="h-3 w-3 shrink-0" />
                          <span className="truncate">{a.linkedPost}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">—</span>
                      )}
                    </span>
                    <span className="flex w-9 shrink-0 items-center justify-center">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-hidden
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Preview drawer */}
      <Drawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.name}
        description={selected ? kindMeta[selected.kind].label : undefined}
        footer={
          selected && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Download className="h-4 w-4" /> Download
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Copy className="h-4 w-4" /> Copy URL
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <div
              className={cn(
                "relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br",
                selected.gradient
              )}
            >
              {(() => {
                const I = kindMeta[selected.kind].icon;
                return <I className="h-14 w-14 text-white/90" />;
              })()}
              {selected.kind === "video" && (
                <span className="absolute flex h-14 w-14 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm">
                  <Play className="h-5 w-5 fill-white text-white" />
                </span>
              )}
              <span className="absolute left-3 top-3 rounded-md bg-black/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                {kindMeta[selected.kind].label}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              {[
                { label: "Kind", value: kindMeta[selected.kind].label },
                { label: "Size", value: selected.size },
                { label: "Dimensions", value: selected.dimensions ?? "—" },
                { label: "Updated", value: selected.updated },
              ].map((row) => (
                <div key={row.label} className="rounded-xl border border-border bg-muted/30 px-3 py-2">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{row.label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Link to post</label>
              <SelectField
                options={postTitles}
                defaultValue={selected.linkedPost ?? "No linked post"}
                placeholder="Choose a post…"
              />
              <p className="text-[11px] text-muted-foreground">
                Linking an asset attaches it to the post composer for quick reuse.
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
