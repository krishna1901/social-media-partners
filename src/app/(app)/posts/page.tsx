"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { SelectField } from "@/components/ui/select-field";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/ui/post-card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Drawer } from "@/components/ui/drawer";
import { StatusBadge } from "@/components/ui/status-badge";
import { ContentTypeBadge } from "@/components/ui/content-type-badge";
import { PlatformStack, PlatformBadge } from "@/components/ui/platform-badge";
import { Avatar } from "@/components/ui/avatar";
import { posts, platformMeta, type Platform } from "@/lib/demo-data";

type Post = (typeof posts)[number];
type View = "grid" | "table";

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

export default function PostsPage() {
  const [view, setView] = useState<View>("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<Post | null>(null);

  const allSelected = selected.size > 0 && selected.size === posts.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === posts.length ? new Set() : new Set(posts.map((p) => p.id))));
  }

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
      { key: "date", header: "Date", render: (r) => <span className="whitespace-nowrap text-muted-foreground">{r.date}</span> },
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
        render: () => (
          <div className="flex items-center justify-end gap-0.5 text-muted-foreground">
            {[
              { icon: Pencil, label: "Edit" },
              { icon: Copy, label: "Duplicate" },
              { icon: Archive, label: "Archive" },
            ].map((a) => (
              <Button
                key={a.label}
                variant="ghost"
                size="icon-sm"
                aria-label={a.label}
                onClick={(e) => e.stopPropagation()}
              >
                <a.icon className="h-3.5 w-3.5" />
              </Button>
            ))}
          </div>
        ),
      },
    ],
    [selected, allSelected]
  );

  return (
    <div className="space-y-6">
      <PageHeader
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

      <FilterBar searchPlaceholder="Search posts…" actions={<SavedFilters />}>
        <SelectField options={platformOptions} defaultValue="all" className="w-full sm:w-40" />
        <SelectField options={statusOptions} defaultValue="all" className="w-full sm:w-36" />
        <SelectField options={typeOptions} defaultValue="all" className="w-full sm:w-36" />
        <SelectField options={dateOptions} defaultValue="Any time" className="w-full sm:w-36" />
      </FilterBar>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky top-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50/80 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-medium text-brand-800">
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-bold text-white">
              {selected.size}
            </span>
            selected
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm">
              <CalendarClock className="h-4 w-4" /> Schedule
            </Button>
            <Button variant="outline" size="sm">
              <Copy className="h-4 w-4" /> Duplicate
            </Button>
            <Button variant="outline" size="sm">
              <Archive className="h-4 w-4" /> Archive
            </Button>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Grid */}
      {view === "grid" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onClick={() => setPreview(p)} />
          ))}
        </div>
      )}

      {/* Table */}
      {view === "table" && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <DataTable columns={columns} data={posts} getRowKey={(r) => r.id} onRowClick={(r) => setPreview(r)} />
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
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4" /> Quick edit
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
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
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={preview.status} withDot />
              <ContentTypeBadge type={preview.type} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Scheduled</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{preview.date}</p>
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

            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Platforms</p>
              <div className="flex flex-wrap gap-1.5">
                {preview.platforms.map((p) => (
                  <PlatformBadge key={p} platform={p} />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Caption</p>
              <p className="text-sm leading-relaxed text-foreground/80">{preview.excerpt}</p>
            </div>

            {/* Faux platform preview */}
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="flex items-center gap-2.5 border-b border-border bg-muted/30 px-4 py-3">
                <Avatar initials="AR" size="sm" gradient="from-brand-500 to-coral-500" />
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

            {/* Metrics for posted content */}
            {preview.status === "posted" && preview.reach && (
              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Performance</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <Eye className="h-3 w-3" /> Reach
                    </p>
                    <p className="mt-1 text-lg font-bold tracking-tight text-foreground">{preview.reach}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                      <TrendingUp className="h-3 w-3" /> Engagement
                    </p>
                    <p className="mt-1 text-lg font-bold tracking-tight text-foreground">{preview.engagement}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
