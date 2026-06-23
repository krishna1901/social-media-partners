"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  FileText,
  LayoutGrid,
  Table as TableIcon,
  Bookmark,
  CalendarClock,
  Copy,
  Archive,
  Trash2,
  Pencil,
  Eye,
  TrendingUp,
  X,
  Search,
  SearchX,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { SelectField } from "@/components/ui/select-field";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PostCard } from "@/components/ui/post-card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ContentTypeBadge } from "@/components/ui/content-type-badge";
import { PlatformStack, PlatformBadge } from "@/components/ui/platform-badge";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { platformMeta, type Platform, type PostStatus, type PostType } from "@/lib/demo-data";
import type { listPosts, getPostCounts } from "@/lib/db/posts";
import { duplicatePost, archivePost, deletePost } from "@/app/actions/posts";

type Post = Awaited<ReturnType<typeof listPosts>>[number];
type Counts = Awaited<ReturnType<typeof getPostCounts>>;
type View = "grid" | "table";

type PostsViewProps = {
  posts: Post[];
  counts: Counts;
};

const platformOptions = [
  { value: "all", label: "All platforms" },
  ...(Object.keys(platformMeta) as Platform[]).map((p) => ({ value: p, label: platformMeta[p].label })),
];

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "ready", label: "Ready" },
  { value: "scheduled", label: "Scheduled" },
  { value: "posted", label: "Posted" },
  { value: "failed", label: "Failed" },
];

const typeOptions = [
  { value: "all", label: "All types" },
  { value: "carousel", label: "Carousel" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "text", label: "Text" },
  { value: "reel", label: "Reel" },
];

const dateOptions = ["Any time", "Next 7 days", "This month", "Last 30 days"];

const savedFilters = [
  { name: "Scheduled this week", hint: "3 posts" },
  { name: "Failed publishes", hint: "1 post" },
];

const DEFAULT_FILTERS = {
  search: "",
  platform: "all",
  status: "all",
  type: "all",
  date: "Any time",
} as const;

/** Visual-only saved-filters dropdown. */
function SavedFilters() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
        <Bookmark className="h-4 w-4" /> Saved filters
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-30 w-56 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg">
            <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Saved filters
            </p>
            {savedFilters.map((f) => (
              <button
                key={f.name}
                type="button"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
              >
                <span className="inline-flex items-center gap-2">
                  <Bookmark className="h-3.5 w-3.5 text-brand-500" />
                  {f.name}
                </span>
                <span className="text-[11px] text-muted-foreground">{f.hint}</span>
              </button>
            ))}
            <div className="my-1 border-t border-border" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50"
            >
              <Plus className="h-3.5 w-3.5" /> Save current filter
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function PostsView({ posts, counts }: PostsViewProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const [view, setView] = useState<View>("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<Post | null>(null);

  const [search, setSearch] = useState<string>(DEFAULT_FILTERS.search);
  const [platform, setPlatform] = useState<string>(DEFAULT_FILTERS.platform);
  const [status, setStatus] = useState<string>(DEFAULT_FILTERS.status);
  const [type, setType] = useState<string>(DEFAULT_FILTERS.type);
  const [date, setDate] = useState<string>(DEFAULT_FILTERS.date);

  // Run a posts mutation: surface its error inline, otherwise refresh the list.
  const runAction = useCallback(
    (action: () => Promise<{ ok: true } | { ok: false; error: string }>, onSuccess?: () => void) => {
      setActionError(null);
      startTransition(async () => {
        const result = await action();
        if (!result.ok) {
          setActionError(result.error);
          return;
        }
        onSuccess?.();
        router.refresh();
      });
    },
    [router]
  );

  const filtersActive =
    search.trim() !== "" ||
    platform !== "all" ||
    status !== "all" ||
    type !== "all" ||
    date !== "Any time";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (q && !(`${p.title} ${p.excerpt} ${p.author}`.toLowerCase().includes(q))) return false;
      if (platform !== "all" && !p.platforms.includes(platform as Platform)) return false;
      if (status !== "all" && p.status !== (status as PostStatus)) return false;
      if (type !== "all" && p.type !== (type as PostType)) return false;
      return true;
    });
  }, [posts, search, platform, status, type]);

  // At-a-glance counts (over the full library, not the filtered view).
  const summary = useMemo(
    () => [
      { label: "All posts", value: counts.total },
      { label: "Scheduled", value: counts.scheduled },
      { label: "Drafts", value: counts.drafts },
      { label: "Posted", value: counts.posted },
    ],
    [counts]
  );

  const filteredIds = useMemo(() => new Set(filtered.map((p) => p.id)), [filtered]);
  const visibleSelectedCount = useMemo(
    () => filtered.reduce((n, p) => (selected.has(p.id) ? n + 1 : n), 0),
    [filtered, selected]
  );
  const allSelected = filtered.length > 0 && visibleSelectedCount === filtered.length;

  function clearFilters() {
    setSearch(DEFAULT_FILTERS.search);
    setPlatform(DEFAULT_FILTERS.platform);
    setStatus(DEFAULT_FILTERS.status);
    setType(DEFAULT_FILTERS.type);
    setDate(DEFAULT_FILTERS.date);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      // Select all visible rows, or clear them if all are already selected.
      const next = new Set(prev);
      if (allSelected) filteredIds.forEach((id) => next.delete(id));
      else filteredIds.forEach((id) => next.add(id));
      return next;
    });
  }, [allSelected, filteredIds]);

  // Apply a posts mutation to every selected (and visible) post at once.
  const runBulk = useCallback(
    (
      label: string,
      action: (id: string) => Promise<{ ok: true; id: string } | { ok: false; error: string }>
    ) => {
      const ids = filtered.filter((p) => selected.has(p.id)).map((p) => p.id);
      if (ids.length === 0) return;
      setActionError(null);
      startTransition(async () => {
        const results = await Promise.all(ids.map((id) => action(id)));
        const failed = results.filter((r) => !r.ok).length;
        setSelected(new Set());
        router.refresh();
        if (failed > 0) {
          toast({
            variant: "error",
            title: "Some posts couldn't be updated",
            description: `${ids.length - failed} of ${ids.length} ${label} successfully.`,
          });
        } else {
          toast({
            variant: "success",
            title: `${ids.length} post${ids.length === 1 ? "" : "s"} ${label}`,
          });
        }
      });
    },
    [filtered, selected, router, toast]
  );

  const columns: Column<Post>[] = useMemo(
    () => [
      {
        key: "select",
        header: (
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4 cursor-pointer rounded border-border accent-brand-500"
            aria-label="Select all posts"
          />
        ),
        className: "w-px",
        render: (r) => (
          <input
            type="checkbox"
            checked={selected.has(r.id)}
            onChange={() => toggle(r.id)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 cursor-pointer rounded border-border accent-brand-500"
            aria-label={`Select ${r.title}`}
          />
        ),
      },
      {
        key: "title",
        header: "Title",
        render: (r) => (
          <div className="min-w-0 max-w-xs">
            <p className="line-clamp-1 font-medium text-foreground">{r.title}</p>
            <p className="line-clamp-1 text-[11px] text-muted-foreground">{r.excerpt}</p>
          </div>
        ),
      },
      { key: "platforms", header: "Platforms", render: (r) => <PlatformStack platforms={r.platforms} /> },
      { key: "type", header: "Type", render: (r) => <ContentTypeBadge type={r.type} /> },
      { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} withDot /> },
      {
        key: "reach",
        header: "Reach",
        align: "right",
        render: (r) =>
          r.reach && r.reach !== "—" ? (
            <span className="tabular-nums font-medium text-foreground">{r.reach}</span>
          ) : (
            <span className="text-muted-foreground/50">—</span>
          ),
      },
      {
        key: "date",
        header: "Date",
        align: "right",
        render: (r) => (
          <span className="whitespace-nowrap tabular-nums text-muted-foreground">{r.date}</span>
        ),
      },
      {
        key: "author",
        header: "Author",
        render: (r) => (
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <Avatar
              initials={r.author.split(" ").map((p) => p[0]).join("").slice(0, 2)}
              size="xs"
              gradient="from-slate-400 to-slate-600"
            />
            <span className="text-xs text-muted-foreground">{r.author}</span>
          </span>
        ),
      },
      {
        key: "actions",
        header: "",
        align: "right",
        className: "w-px",
        render: (r) => (
          <div className="flex items-center justify-end gap-0.5 text-muted-foreground">
            <Link href="/posts/new" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon-sm" aria-label="Edit">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Duplicate"
              disabled={pending}
              onClick={(e) => {
                e.stopPropagation();
                runAction(() => duplicatePost(r.id));
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Archive"
              disabled={pending}
              onClick={(e) => {
                e.stopPropagation();
                runAction(() => archivePost(r.id));
              }}
            >
              <Archive className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [selected, allSelected, toggleAll, pending, runAction]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Post Manager"
        description="Draft, schedule and review content across every platform."
        icon={<FileText className="h-5 w-5" />}
        actions={
          <>
            <Segmented
              value={view}
              onValueChange={(v) => setView(v as View)}
              options={[
                { value: "grid", label: "Grid", icon: LayoutGrid },
                { value: "table", label: "Table", icon: TableIcon },
              ]}
            />
            <Link href="/posts/new">
              <Button className="bg-gradient-to-r from-brand-500 to-coral-500 text-white shadow-sm shadow-brand-500/20 hover:opacity-90">
                <Plus className="h-4 w-4" /> Create post
              </Button>
            </Link>
          </>
        }
      />

      {/* At-a-glance summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summary.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-foreground">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <FilterBar actions={<SavedFilters />}>
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search posts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <SelectField options={platformOptions} value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full sm:w-40" />
        <SelectField options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} className="w-full sm:w-36" />
        <SelectField options={typeOptions} value={type} onChange={(e) => setType(e.target.value)} className="w-full sm:w-36" />
        <SelectField options={dateOptions} value={date} onChange={(e) => setDate(e.target.value)} className="w-full sm:w-36" />
        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </FilterBar>

      {/* Inline action error */}
      {actionError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
          {actionError}
        </p>
      )}

      {/* Result count + active filter context */}
      {filtered.length > 0 && (
        <div className="-mb-2 flex items-center justify-between px-1 text-xs text-muted-foreground">
          <p>
            Showing <span className="font-semibold tabular-nums text-foreground">{filtered.length}</span> of{" "}
            <span className="tabular-nums">{posts.length}</span> posts
          </p>
          {filtersActive && <span className="text-brand-600">Filters applied</span>}
        </div>
      )}

      {/* Bulk action bar */}
      {visibleSelectedCount > 0 && (
        <div className="sticky top-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50/80 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-medium text-brand-800">
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-bold tabular-nums text-white">
              {visibleSelectedCount}
            </span>
            <span>
              post{visibleSelectedCount === 1 ? "" : "s"} selected
            </span>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
            >
              <X className="h-3 w-3" /> Clear selection
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast({
                  variant: "info",
                  title: "Bulk scheduling is coming soon",
                  description: "For now, schedule posts one at a time from the composer.",
                })
              }
            >
              <CalendarClock className="h-4 w-4" /> Schedule
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => runBulk("duplicated", duplicatePost)}
            >
              <Copy className="h-4 w-4" /> Duplicate
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => runBulk("archived", archivePost)}
            >
              <Archive className="h-4 w-4" /> Archive
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={pending}
              onClick={() => {
                if (
                  window.confirm(
                    `Delete ${visibleSelectedCount} post${visibleSelectedCount === 1 ? "" : "s"}? This can't be undone.`
                  )
                ) {
                  runBulk("deleted", deletePost);
                }
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Empty state — nothing matches the current filters */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-6 w-6" />}
          title="No posts match your filters"
          description="Try a different search term or loosen the platform, status and type filters to see more of your content."
          action={
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" /> Clear filters
            </Button>
          }
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <PostCard key={p.id} post={p} onClick={() => setPreview(p)} className="h-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <DataTable columns={columns} data={filtered} getRowKey={(r) => r.id} onRowClick={(r) => setPreview(r)} />
        </div>
      )}

      {/* Preview drawer */}
      <Drawer
        open={preview !== null}
        onOpenChange={(o) => !o && setPreview(null)}
        title={preview?.title}
        description={preview ? `${preview.author} · ${preview.date}` : undefined}
        footer={
          preview && (
            <div className="flex items-center justify-between gap-2">
              <Link href="/posts/new">
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4" /> Quick edit
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => runAction(() => duplicatePost(preview.id))}
                >
                  <Copy className="h-4 w-4" /> Duplicate
                </Button>
                <Link href="/posts/new">
                  <Button size="sm" className="bg-gradient-to-r from-brand-500 to-coral-500 text-white hover:opacity-90">
                    Open editor
                  </Button>
                </Link>
              </div>
            </div>
          )
        }
      >
        {preview && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={preview.status} withDot />
              <ContentTypeBadge type={preview.type} />
            </div>

            {preview.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.image} alt="" className="aspect-video w-full rounded-2xl object-cover ring-1 ring-border/50" />
            )}

            {/* Meta section */}
            <section className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Overview</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Scheduled</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{preview.date}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Author</p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Avatar
                      initials={preview.author.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                      size="xs"
                      gradient="from-slate-400 to-slate-600"
                    />
                    {preview.author}
                  </p>
                </div>
              </div>
            </section>

            {/* Platforms section */}
            <section className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Publishing to {preview.platforms.length} channel{preview.platforms.length === 1 ? "" : "s"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {preview.platforms.map((p) => (
                  <PlatformBadge key={p} platform={p} />
                ))}
              </div>
            </section>

            {/* Caption section */}
            <section className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Caption</p>
              <p className="text-sm leading-relaxed text-foreground/80">{preview.excerpt}</p>
            </section>

            {/* Faux platform preview */}
            <section className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
              <div className="overflow-hidden rounded-2xl border border-border">
                <div className="flex items-center gap-2.5 border-b border-border bg-muted/30 px-4 py-3">
                  <Avatar initials="RS" size="sm" gradient="from-brand-500 to-coral-500" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">Rivera Studio</p>
                    <p className="text-[11px] text-muted-foreground">
                      {platformMeta[preview.platforms[0]].label} · {preview.date}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <p className="text-sm font-medium text-foreground">{preview.title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{preview.excerpt}</p>
                  <div className="flex aspect-[16/10] items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/10 via-violet-500/10 to-coral-500/10 text-xs font-medium text-muted-foreground">
                    <ContentTypeBadge type={preview.type} /> preview
                  </div>
                </div>
              </div>
            </section>

            {/* Metrics for posted content */}
            {preview.status === "posted" && preview.reach && (
              <section className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Performance</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <Eye className="h-3 w-3" /> Reach
                    </p>
                    <p className="mt-1 text-lg font-bold tracking-tight tabular-nums text-foreground">{preview.reach}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                      <TrendingUp className="h-3 w-3" /> Engagement
                    </p>
                    <p className="mt-1 text-lg font-bold tracking-tight tabular-nums text-foreground">{preview.engagement}</p>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
