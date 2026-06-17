"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  Search,
  FolderOpen,
  Calendar,
  Maximize2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { SelectField } from "@/components/ui/select-field";
import { Input } from "@/components/ui/input";
import { MediaCard } from "@/components/ui/media-card";
import { UploadDropzone } from "@/components/ui/upload-dropzone";
import { Segmented } from "@/components/ui/segmented";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { uploadMedia, type MediaKind } from "@/lib/storage";
import {
  createMediaAsset,
  linkMediaToPost,
  archiveMedia,
  deleteMedia,
} from "@/app/actions/media";
import type { listMedia } from "@/lib/db/media";
import type { listPosts } from "@/lib/db/posts";

type MediaViewProps = {
  assets: Awaited<ReturnType<typeof listMedia>>;
  posts: Awaited<ReturnType<typeof listPosts>>;
};

type MediaAsset = MediaViewProps["assets"][number];

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

const typeOptions = [
  { value: "all", label: "All types" },
  { value: "images", label: "Images" },
  { value: "videos", label: "Videos" },
  { value: "zips", label: "ZIPs" },
  { value: "carousels", label: "Carousels" },
  { value: "thumbnails", label: "Thumbnails" },
];
const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name", label: "Name A-Z" },
  { value: "type", label: "By type" },
  { value: "linked", label: "By linked post" },
];

/** Maps a filter value to the asset kinds it includes. */
const typeFilter: Record<string, MediaAsset["kind"][]> = {
  images: ["image"],
  videos: ["video"],
  zips: ["zip"],
  carousels: ["carousel"],
  thumbnails: ["thumbnail"],
};

/** Rough relative-recency rank so "Newest"/"Oldest" sorts are stable. */
const recencyRank = (updated: string) => {
  const m = updated.match(/(\d+)/);
  const n = m ? parseInt(m[1], 10) : 0;
  if (updated === "Yesterday") return 24;
  if (updated.includes("h")) return n;
  if (updated.includes("d")) return n * 24;
  if (updated.includes("w")) return n * 24 * 7;
  return n;
};

/** Guesses a media kind from a File's MIME type for upload bucket selection. */
function kindForFile(file: File): MediaKind {
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/zip" || file.type === "application/x-zip-compressed")
    return "zip";
  return "image";
}

export function MediaView({ assets, posts }: MediaViewProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("newest");

  const images = assets.filter((a) => a.kind === "image" || a.kind === "thumbnail").length;
  const videos = assets.filter((a) => a.kind === "video").length;

  const postOptions = useMemo(
    () => [
      { value: "", label: "No linked post" },
      ...posts.map((p) => ({ value: p.id, label: p.title })),
    ],
    [posts]
  );

  const handleUpload = (files: FileList) => {
    const file = files[0];
    if (!file) return;
    setError(null);
    start(async () => {
      try {
        const kind = kindForFile(file);
        const result = await uploadMedia(file, { kind });
        const res = await createMediaAsset({
          name: file.name,
          kind,
          bucket: result.bucket,
          path: result.path,
          url: result.url,
          size_bytes: result.size,
          mime_type: result.mimeType,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      }
    });
  };

  const handleLink = (mediaId: string, postId: string) => {
    setError(null);
    start(async () => {
      const res = await linkMediaToPost(mediaId, postId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSelected(null);
      router.refresh();
    });
  };

  const handleDelete = (mediaId: string) => {
    setError(null);
    start(async () => {
      const res = await deleteMedia(mediaId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSelected(null);
      router.refresh();
    });
  };

  const handleArchive = (mediaId: string) => {
    setError(null);
    start(async () => {
      const res = await archiveMedia(mediaId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSelected(null);
      router.refresh();
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = assets.filter((a) => {
      if (type !== "all" && !typeFilter[type]?.includes(a.kind)) return false;
      if (q && !a.name.toLowerCase().includes(q) && !(a.linkedPost?.toLowerCase().includes(q)))
        return false;
      return true;
    });
    const sorted = [...result];
    switch (sort) {
      case "oldest":
        sorted.sort((a, b) => recencyRank(b.updated) - recencyRank(a.updated));
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "type":
        sorted.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
        break;
      case "linked":
        sorted.sort((a, b) => (a.linkedPost ?? "~").localeCompare(b.linkedPost ?? "~"));
        break;
      default: // newest
        sorted.sort((a, b) => recencyRank(a.updated) - recencyRank(b.updated));
    }
    return sorted;
  }, [assets, query, type, sort]);

  const isFiltered = query.trim() !== "" || type !== "all";
  const clearFilters = () => {
    setQuery("");
    setType("all");
    setSort("newest");
  };

  const openPreview = (asset: MediaAsset) => setSelected(asset);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assets"
        icon={<FolderOpen className="h-5 w-5" />}
        title="Media Library"
        description="Organize images, videos, ZIPs and carousel assets in one place."
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
            <Button variant="gradient">
              <UploadCloud className="h-4 w-4" /> Upload
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total assets"
          value={assets.length}
          delta="+8"
          positive
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
          delta="24%"
          positive
          icon={<HardDrive className="h-4 w-4" />}
          accent="from-emerald-500 to-teal-500"
          hint="of 5 GB on the Pro plan"
        />
      </div>

      {/* Upload dropzone */}
      <UploadDropzone
        hint="Images, videos, ZIPs and carousel PNGs up to 200MB · drag a file or browse"
        onFiles={handleUpload}
      />
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assets…"
            className="h-9 pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search assets"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
            {filtered.length} of {assets.length}
          </span>
          <SelectField
            options={typeOptions}
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-40"
            aria-label="Filter by type"
          />
          <SelectField
            options={sortOptions}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-44"
            aria-label="Sort assets"
          />
        </div>
      </div>

      {/* Views */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="No assets match your filters"
          description={
            isFiltered
              ? "Try a different search term or asset type — or upload something new to get started."
              : "Your library is empty. Upload your first asset to get started."
          }
          action={
            <div className="flex items-center gap-2">
              {isFiltered && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
              <Button variant="gradient" size="sm">
                <UploadCloud className="h-4 w-4" /> Upload
              </Button>
            </div>
          }
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((a) => (
            <MediaCard key={a.id} asset={a} onClick={() => openPreview(a)} className="h-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto scrollbar-thin">
            <div className="min-w-[680px]">
              {/* header row */}
              <div className="flex items-center gap-4 border-b border-border bg-muted/30 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="w-12" />
                <span className="flex-1">Name</span>
                <span className="w-24">Type</span>
                <span className="w-20 text-right tabular-nums">Size</span>
                <span className="hidden w-28 lg:block">Dimensions</span>
                <span className="w-24">Updated</span>
                <span className="hidden w-44 xl:block">Linked post</span>
                <span className="w-9" />
              </div>
              <ul className="divide-y divide-border">
                {filtered.map((a) => {
                  const meta = kindMeta[a.kind];
                  const I = meta.icon;
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => openPreview(a)}
                        className="group flex w-full items-center gap-4 px-4 py-2.5 text-left transition-colors hover:bg-muted/40"
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
                        <span className="w-24">
                          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground/70">
                            <I className="h-3 w-3" />
                            {meta.label}
                          </span>
                        </span>
                        <span className="w-20 text-right text-xs tabular-nums text-muted-foreground">{a.size}</span>
                        <span className="hidden w-28 text-xs tabular-nums text-muted-foreground lg:block">{a.dimensions ?? "—"}</span>
                        <span className="w-24 text-xs text-muted-foreground">{a.updated}</span>
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
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors group-hover:bg-muted group-hover:text-foreground"
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
          </div>
        </div>
      )}

      {/* Preview drawer */}
      <Drawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.name}
        description={selected ? `${kindMeta[selected.kind].label} · ${selected.size}` : undefined}
        footer={
          selected && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Download className="h-4 w-4" /> Download
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Copy className="h-4 w-4" /> Copy URL
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={() => selected && handleDelete(selected.id)}
              >
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
                "group relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br shadow-inner",
                selected.gradient
              )}
            >
              <div className="bg-grid absolute inset-0 opacity-20" />
              {(() => {
                const I = kindMeta[selected.kind].icon;
                return <I className="relative h-16 w-16 text-white/90 drop-shadow" />;
              })()}
              {selected.kind === "video" && (
                <span className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm">
                  <Play className="h-6 w-6 fill-white text-white" />
                </span>
              )}
              <span className="absolute left-3 top-3 rounded-md bg-black/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                {kindMeta[selected.kind].label}
              </span>
              <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50">
                <Maximize2 className="h-3.5 w-3.5" />
              </span>
              {selected.dimensions && (
                <span className="absolute bottom-3 right-3 rounded-md bg-black/40 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur-sm">
                  {selected.dimensions}
                </span>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details</h3>
              <dl className="overflow-hidden rounded-xl border border-border">
                {[
                  { label: "Kind", value: kindMeta[selected.kind].label, icon: <Layers className="h-3.5 w-3.5" /> },
                  { label: "File size", value: selected.size, icon: <HardDrive className="h-3.5 w-3.5" /> },
                  { label: "Dimensions", value: selected.dimensions ?? "—", icon: <Maximize2 className="h-3.5 w-3.5" /> },
                  { label: "Updated", value: selected.updated, icon: <Calendar className="h-3.5 w-3.5" /> },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5 last:border-b-0 odd:bg-muted/20"
                  >
                    <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="text-muted-foreground/70">{row.icon}</span>
                      {row.label}
                    </dt>
                    <dd className="text-sm font-semibold tabular-nums text-foreground">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Link to post</label>
              <SelectField
                options={postOptions}
                defaultValue=""
                placeholder="Choose a post…"
                disabled={pending}
                onChange={(e) => {
                  if (e.target.value) handleLink(selected.id, e.target.value);
                }}
              />
              <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <Link2 className="mt-px h-3 w-3 shrink-0" />
                Linking an asset attaches it to the post composer for quick reuse.
              </p>
              <div className="pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => selected && handleArchive(selected.id)}
                >
                  <FileArchive className="h-4 w-4" /> Archive
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
