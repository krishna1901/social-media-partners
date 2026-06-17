"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Lightbulb,
  Sparkles,
  Flame,
  CalendarClock,
  LayoutGrid,
  Table as TableIcon,
  List as ListIcon,
  GripVertical,
  MoreHorizontal,
  Wand2,
  FileText,
  Copy,
  Archive,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ChartCard } from "@/components/ui/chart-card";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ContentTypeBadge } from "@/components/ui/content-type-badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ideaStatuses, type IdeaStatus, type Priority } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import {
  createIdea,
  convertIdeaToPost,
  archiveIdea,
} from "@/app/actions/ideas";
import type { listIdeas } from "@/lib/db/ideas";

type IdeasViewProps = { ideas: Awaited<ReturnType<typeof listIdeas>> };
type Idea = IdeasViewProps["ideas"][number];
type View = "kanban" | "table" | "list";

const priorityMeta: Record<Priority, { label: string; className: string }> = {
  high: { label: "High", className: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-100" },
  medium: { label: "Medium", className: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100" },
  low: { label: "Low", className: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200" },
};

function PriorityBadge({ priority }: { priority: Priority }) {
  const meta = priorityMeta[priority];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", meta.className)}>
      {meta.label}
    </span>
  );
}

function CategoryChip({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-700">
      {category}
    </span>
  );
}

function TrendChip({ trend }: { trend: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
      <Flame className="h-3 w-3" />
      {trend}
    </span>
  );
}

/** Kebab menu — wires Convert to post / Archive to server actions. */
function IdeaMenu({
  idea,
  className,
}: {
  idea: Idea;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>) => {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const ideaActions = [
    {
      label: "Convert to post",
      icon: Wand2,
      onSelect: () => run(() => convertIdeaToPost(idea.id)),
    },
    { label: "Generate outline", icon: FileText, onSelect: undefined },
    { label: "Duplicate", icon: Copy, onSelect: undefined },
    {
      label: "Archive",
      icon: Archive,
      onSelect: () => run(() => archiveIdea(idea.id)),
    },
  ];

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Idea actions"
        disabled={pending}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg">
            {ideaActions.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  a.onSelect?.();
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted",
                  a.label === "Archive" && "text-red-600 hover:bg-red-50"
                )}
              >
                <a.icon className="h-3.5 w-3.5" />
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
      {error && (
        <p className="absolute right-0 top-9 z-40 w-44 rounded-md bg-red-50 px-2 py-1 text-[11px] text-red-700 shadow">
          {error}
        </p>
      )}
    </div>
  );
}

export function IdeasView({ ideas }: IdeasViewProps) {
  const [view, setView] = useState<View>("kanban");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, startCreate] = useTransition();
  const router = useRouter();

  const handleCreate = () => {
    setCreateError(null);
    startCreate(async () => {
      const res = await createIdea({ title: "New idea", status: "idea" });
      if (res.ok) {
        router.refresh();
      } else {
        setCreateError(res.error);
      }
    });
  };

  const stats = useMemo(() => {
    const total = ideas.length;
    const ready = ideas.filter((i) => i.status === "ready").length;
    const high = ideas.filter((i) => i.priority === "high").length;
    const thisWeek = ideas.filter(
      (i) => i.status === "draft" || i.status === "ready" || i.status === "scheduled"
    ).length;
    return { total, ready, high, thisWeek };
  }, [ideas]);

  const byStatus = useMemo(() => {
    const map: Record<IdeaStatus, Idea[]> = { idea: [], draft: [], ready: [], scheduled: [], posted: [] };
    ideas.forEach((i) => map[i.status].push(i));
    return map;
  }, [ideas]);

  const tableColumns: Column<Idea>[] = [
    {
      key: "title",
      header: "Title",
      render: (r) => (
        <div className="min-w-0">
          <p className="line-clamp-1 font-medium text-foreground">{r.title}</p>
          {r.notes && <p className="line-clamp-1 text-[11px] text-muted-foreground">{r.notes}</p>}
        </div>
      ),
    },
    { key: "category", header: "Category", render: (r) => <CategoryChip category={r.category} /> },
    {
      key: "sourceTrend",
      header: "Source trend",
      render: (r) =>
        r.sourceTrend ? <TrendChip trend={r.sourceTrend} /> : <span className="text-xs text-muted-foreground/60">—</span>,
    },
    { key: "priority", header: "Priority", render: (r) => <PriorityBadge priority={r.priority} /> },
    { key: "type", header: "Type", render: (r) => <ContentTypeBadge type={r.type} /> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} withDot /> },
    {
      key: "actions",
      header: "",
      align: "right",
      className: "w-px",
      render: (r) => <IdeaMenu idea={r} className="flex justify-end" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Idea Backlog"
        description="Capture, organize and develop content ideas."
        icon={<Lightbulb className="h-5 w-5" />}
        actions={
          <>
            <Segmented
              value={view}
              onValueChange={(v) => setView(v as View)}
              options={[
                { value: "kanban", label: "Kanban", icon: LayoutGrid },
                { value: "table", label: "Table", icon: TableIcon },
                { value: "list", label: "List", icon: ListIcon },
              ]}
            />
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-gradient-to-r from-brand-500 to-coral-500 text-white shadow-sm shadow-brand-500/20 hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> New idea
            </Button>
          </>
        }
      />

      {createError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{createError}</p>
      )}

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total ideas"
          value={stats.total}
          delta="+4"
          positive
          hint="in your backlog"
          icon={<Lightbulb className="h-4 w-4" />}
          accent="from-brand-500 to-coral-500"
        />
        <StatCard
          label="Ready to produce"
          value={stats.ready}
          delta="+2"
          positive
          hint="approved & scoped"
          icon={<Sparkles className="h-4 w-4" />}
          accent="from-emerald-500 to-teal-500"
        />
        <StatCard
          label="High priority"
          value={stats.high}
          hint="needs attention"
          icon={<Flame className="h-4 w-4" />}
          accent="from-rose-500 to-coral-500"
        />
        <StatCard
          label="This week"
          value={stats.thisWeek}
          delta="+1"
          positive
          hint="in progress"
          icon={<CalendarClock className="h-4 w-4" />}
          accent="from-violet-500 to-indigo-500"
        />
      </div>

      {/* Kanban */}
      {view === "kanban" && (
        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
          {ideaStatuses.map((col) => {
            const items = byStatus[col.key];
            return (
              <div key={col.key} className="flex w-[300px] shrink-0 flex-col">
                <div className="flex items-center justify-between rounded-t-2xl border border-b-0 border-border bg-muted/40 px-4 py-3">
                  <StatusBadge status={col.key} withDot />
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-card px-1.5 text-[11px] font-semibold text-muted-foreground ring-1 ring-border">
                    {items.length}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 rounded-b-2xl border border-border bg-muted/20 p-2.5">
                  {items.map((idea) => (
                    <div
                      key={idea.id}
                      className="group cursor-grab rounded-xl border border-border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-brand-600">
                          {idea.title}
                        </h3>
                        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/70" />
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <CategoryChip category={idea.category} />
                        <ContentTypeBadge type={idea.type} />
                        <PriorityBadge priority={idea.priority} />
                      </div>
                      {idea.sourceTrend && (
                        <div className="mt-2">
                          <TrendChip trend={idea.sourceTrend} />
                        </div>
                      )}
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
                        <span className="text-[11px] font-medium text-muted-foreground/70">Drag to move</span>
                        <IdeaMenu idea={idea} />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={creating}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-brand-300 hover:bg-card hover:text-brand-600"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add idea
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      {view === "table" && (
        <ChartCard title="All ideas" subtitle={`${ideas.length} ideas across your pipeline`} bodyClassName="p-0">
          <DataTable columns={tableColumns} data={ideas} getRowKey={(r) => r.id} />
        </ChartCard>
      )}

      {/* List */}
      {view === "list" && (
        <ChartCard title="All ideas" subtitle={`${ideas.length} ideas across your pipeline`} bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {ideas.map((idea) => (
              <li key={idea.id} className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-foreground group-hover:text-brand-600">
                    {idea.title}
                  </p>
                </div>
                <div className="hidden items-center gap-1.5 sm:flex">
                  <CategoryChip category={idea.category} />
                  {idea.sourceTrend && <TrendChip trend={idea.sourceTrend} />}
                </div>
                <PriorityBadge priority={idea.priority} />
                <ContentTypeBadge type={idea.type} />
                <StatusBadge status={idea.status} withDot />
                <IdeaMenu idea={idea} />
              </li>
            ))}
          </ul>
        </ChartCard>
      )}
    </div>
  );
}
