"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  CalendarDays,
  CalendarRange,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Pencil,
  Repeat,
  ArrowUpRight,
  CalendarClock,
  CalendarX,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { SelectField } from "@/components/ui/select-field";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { ContentTypeBadge } from "@/components/ui/content-type-badge";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { platformMeta, type Platform } from "@/lib/demo-data";
import type { listCalendarEvents } from "@/lib/db/calendar";

type CalendarViewProps = {
  events: Awaited<ReturnType<typeof listCalendarEvents>>;
};

type CalendarEvent = CalendarViewProps["events"][number];

const TODAY = 17;
const BASE_MONTH = new Date(2026, 5, 1); // June 2026 — the month the demo data lives in
const FIRST_WEEKDAY = 1; // June 1, 2026 is Monday (Sunday-start grid → index 1)
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEK_DAYS = [14, 15, 16, 17, 18, 19, 20]; // week containing the 17th
const HOURS = [7, 9, 11, 13, 15, 17, 19]; // time rail anchors

/** Subtle left-border color keyed to status. */
const statusBorder: Record<string, string> = {
  scheduled: "border-l-amber-400",
  draft: "border-l-slate-300",
  ready: "border-l-sky-400",
  posted: "border-l-emerald-400",
  failed: "border-l-red-400",
};

const platformOptions = [
  { value: "all", label: "All platforms" },
  ...(Object.keys(platformMeta) as Platform[]).map((p) => ({
    value: p,
    label: platformMeta[p].label,
  })),
];
const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "draft", label: "Draft" },
  { value: "ready", label: "Ready" },
  { value: "posted", label: "Posted" },
];

const WEEKDAY_FOR_DAY = (day: number) => WEEKDAYS[(FIRST_WEEKDAY + day - 1) % 7];
const WEEKDAY_LONG_FOR_DAY = (day: number) => WEEKDAYS_LONG[(FIRST_WEEKDAY + day - 1) % 7];

export function CalendarView({ events }: CalendarViewProps) {
  const toast = useToast();
  const [view, setView] = useState("month");
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("all");
  // Month being viewed. Demo events all live in June 2026 (the base month); other
  // months render as empty grids so paging through the calendar still works.
  const [monthDate, setMonthDate] = useState(BASE_MONTH);

  const monthLabel = monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const isBaseMonth =
    monthDate.getFullYear() === BASE_MONTH.getFullYear() &&
    monthDate.getMonth() === BASE_MONTH.getMonth();

  const visibleEvents = useMemo(
    () =>
      events.filter(
        (e) =>
          (platform === "all" || e.platform === platform) &&
          (status === "all" || e.status === status)
      ),
    [events, platform, status]
  );

  const eventsForDay = (day: number) =>
    visibleEvents.filter((e) => e.day === day).sort((a, b) => a.time.localeCompare(b.time));

  // Month grid only shows events when viewing the base month.
  const monthEventsForDay = (day: number) => (isBaseMonth ? eventsForDay(day) : []);

  // Build the month grid with leading blanks (Sunday-start) for the viewed month.
  const cells = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [monthDate]);

  const agendaDays = useMemo(
    () => Array.from(new Set(visibleEvents.map((e) => e.day))).sort((a, b) => a - b),
    [visibleEvents]
  );

  const scheduledCount = visibleEvents.filter((e) => e.status === "scheduled").length;
  const draftCount = visibleEvents.filter((e) => e.status === "draft").length;
  const readyCount = visibleEvents.filter((e) => e.status === "ready").length;
  const isFiltered = platform !== "all" || status !== "all";
  const clearFilters = () => {
    setPlatform("all");
    setStatus("all");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Planning"
        icon={<CalendarClock className="h-5 w-5" />}
        title="Content Calendar"
        description="Plan and schedule your content across every platform."
        actions={
          <>
            <Segmented
              value={view}
              onValueChange={setView}
              options={[
                { value: "month", label: "Month", icon: CalendarDays },
                { value: "week", label: "Week", icon: CalendarRange },
                { value: "agenda", label: "Agenda", icon: ListChecks },
              ]}
            />
            <Link href="/posts/new">
              <Button variant="gradient">
                <CalendarPlus className="h-4 w-4" /> Schedule post
              </Button>
            </Link>
          </>
        }
      />

      {/* At-a-glance summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="In view" value={visibleEvents.length} tone="brand" />
        <SummaryStat label="Scheduled" value={scheduledCount} tone="amber" />
        <SummaryStat label="Ready" value={readyCount} tone="sky" />
        <SummaryStat label="Drafts" value={draftCount} tone="slate" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        {view === "month" ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous month"
              onClick={() =>
                setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="min-w-[150px] text-center text-base font-semibold tracking-tight text-foreground">
              {monthLabel}
            </h2>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next month"
              onClick={() =>
                setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 text-muted-foreground"
              disabled={isBaseMonth}
              onClick={() => setMonthDate(BASE_MONTH)}
            >
              Today
            </Button>
          </div>
        ) : (
          <h2 className="text-base font-semibold tracking-tight text-foreground">June 2026</h2>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {isFiltered && (
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={clearFilters}>
              Clear
            </Button>
          )}
          <SelectField
            options={platformOptions}
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-44"
            aria-label="Filter by platform"
          />
          <SelectField
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-40"
            aria-label="Filter by status"
          />
        </div>
      </div>

      {view === "month" && (
        <MonthView
          cells={cells}
          eventsForDay={monthEventsForDay}
          onSelect={setSelected}
          today={isBaseMonth ? TODAY : -1}
        />
      )}
      {view === "week" && <WeekView eventsForDay={eventsForDay} onSelect={setSelected} />}
      {view === "agenda" && (
        <AgendaView
          days={agendaDays}
          eventsForDay={eventsForDay}
          onSelect={setSelected}
          isFiltered={isFiltered}
          onClear={clearFilters}
        />
      )}

      {/* Event detail drawer */}
      <Drawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.title}
        description={selected ? `${WEEKDAY_LONG_FOR_DAY(selected.day)}, June ${selected.day} · ${selected.time}` : undefined}
        footer={
          selected && (
            <div className="flex items-center gap-2">
              <Link href="/posts/new" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() =>
                  toast({
                    variant: "info",
                    title: "Reschedule is coming soon",
                    description: "For now, open the post to change its scheduled time.",
                  })
                }
              >
                <Repeat className="h-4 w-4" /> Reschedule
              </Button>
              <Link href="/posts/new" className="flex-1">
                <Button variant="gradient" size="sm" className="w-full">
                  <ArrowUpRight className="h-4 w-4" /> Open post
                </Button>
              </Link>
            </div>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <PlatformBadge platform={selected.platform} />
              <StatusBadge status={selected.status} withDot />
              <ContentTypeBadge type={selected.type} />
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details</h3>
              <dl className="overflow-hidden rounded-xl border border-border">
                {[
                  { label: "Date", value: `${WEEKDAY_LONG_FOR_DAY(selected.day)}, June ${selected.day}` },
                  { label: "Time", value: selected.time },
                  { label: "Platform", value: platformMeta[selected.platform].label },
                  { label: "Format", value: selected.type },
                  { label: "Status", value: selected.status },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5 last:border-b-0 odd:bg-muted/20"
                  >
                    <dt className="text-sm text-muted-foreground">{row.label}</dt>
                    <dd className="text-sm font-semibold capitalize text-foreground">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs font-semibold text-foreground">Publishing window</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                Queued to publish at {selected.time} on June {selected.day}.
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* -------------------------------- summary ---------------------------------- */

const summaryTone: Record<string, string> = {
  brand: "from-brand-500 to-coral-500",
  amber: "from-amber-400 to-orange-500",
  sky: "from-sky-400 to-blue-500",
  slate: "from-slate-400 to-slate-600",
};

function SummaryStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
      <span className={cn("h-9 w-1.5 shrink-0 rounded-full bg-gradient-to-b", summaryTone[tone])} />
      <div>
        <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/* --------------------------------- month ---------------------------------- */

function MonthView({
  cells,
  eventsForDay,
  onSelect,
  today,
}: {
  cells: (number | null)[];
  eventsForDay: (day: number) => CalendarEvent[];
  onSelect: (e: CalendarEvent) => void;
  today: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto scrollbar-thin">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 border-b border-border bg-muted/30">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`b-${i}`} className="min-h-[120px] border-b border-r border-border bg-muted/10 last:border-r-0" />;
              }
              const dayEvents = eventsForDay(day);
              const isToday = day === today;
              return (
                <div
                  key={day}
                  className={cn(
                    "group/cell relative min-h-[120px] border-b border-r border-border p-1.5 transition-colors hover:bg-muted/20 [&:nth-child(7n)]:border-r-0",
                    isToday && "bg-brand-50/40"
                  )}
                >
                  <div className="flex items-center justify-between px-1">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                        isToday ? "bg-gradient-to-br from-brand-500 to-coral-500 text-white shadow-sm" : "text-foreground"
                      )}
                    >
                      {day}
                    </span>
                    <Link
                      href="/posts/new"
                      className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover/cell:opacity-100"
                      aria-label={`Schedule a post on day ${day}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayEvents.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => onSelect(ev)}
                        className={cn(
                          "flex w-full cursor-grab items-center gap-1.5 rounded-md border-l-2 bg-muted/50 px-1.5 py-1 text-left transition-colors hover:bg-muted hover:shadow-sm active:cursor-grabbing",
                          statusBorder[ev.status] ?? "border-l-slate-300"
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", platformMeta[ev.platform].dot)} />
                        <span className="line-clamp-1 flex-1 text-[11px] font-medium text-foreground">{ev.title}</span>
                        <span className="hidden shrink-0 text-[10px] tabular-nums text-muted-foreground sm:block">{ev.time}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- week ----------------------------------- */

function WeekView({
  eventsForDay,
  onSelect,
}: {
  eventsForDay: (day: number) => CalendarEvent[];
  onSelect: (e: CalendarEvent) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto scrollbar-thin">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-border bg-muted/30">
            <div className="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Time</div>
            {WEEK_DAYS.map((day, i) => {
              const isToday = day === TODAY;
              return (
                <div
                  key={day}
                  className={cn("border-l border-border px-2 py-2 text-center", isToday && "bg-brand-50/40")}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{WEEKDAYS[i]}</p>
                  <p
                    className={cn(
                      "mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold tabular-nums",
                      isToday ? "bg-gradient-to-br from-brand-500 to-coral-500 text-white shadow-sm" : "text-foreground"
                    )}
                  >
                    {day}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="max-h-[560px] overflow-y-auto scrollbar-thin">
            {HOURS.map((h) => (
              <div key={h} className="grid min-h-[76px] grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-border last:border-b-0">
                <div className="px-2 py-1.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                  {String(h).padStart(2, "0")}:00
                </div>
                {WEEK_DAYS.map((day) => {
                  const slotEvents = eventsForDay(day).filter((ev) => {
                    const hour = parseInt(ev.time.slice(0, 2), 10);
                    return hour >= h && hour < h + 2;
                  });
                  const isToday = day === TODAY;
                  return (
                    <div
                      key={`${h}-${day}`}
                      className={cn("border-l border-border p-1", isToday && "bg-brand-50/30")}
                    >
                      {slotEvents.map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => onSelect(ev)}
                          className={cn(
                            "mb-1 flex w-full flex-col gap-0.5 rounded-md border-l-2 bg-muted/50 px-1.5 py-1 text-left transition-colors hover:bg-muted hover:shadow-sm",
                            statusBorder[ev.status] ?? "border-l-slate-300"
                          )}
                        >
                          <span className="flex items-center gap-1">
                            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", platformMeta[ev.platform].dot)} />
                            <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">{ev.time}</span>
                          </span>
                          <span className="line-clamp-2 text-[11px] font-medium text-foreground">{ev.title}</span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- agenda ---------------------------------- */

function AgendaView({
  days,
  eventsForDay,
  onSelect,
  isFiltered,
  onClear,
}: {
  days: number[];
  eventsForDay: (day: number) => CalendarEvent[];
  onSelect: (e: CalendarEvent) => void;
  isFiltered: boolean;
  onClear: () => void;
}) {
  if (days.length === 0) {
    return (
      <EmptyState
        icon={<CalendarX className="h-6 w-6" />}
        title="Nothing scheduled"
        description={
          isFiltered
            ? "No posts match these filters this month. Try a different platform or status."
            : "There's nothing on the calendar yet. Schedule your first post to fill it up."
        }
        action={
          <div className="flex items-center gap-2">
            {isFiltered && (
              <Button variant="outline" size="sm" onClick={onClear}>
                Clear filters
              </Button>
            )}
            <Link href="/posts/new">
              <Button variant="gradient" size="sm">
                <CalendarPlus className="h-4 w-4" /> Schedule post
              </Button>
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {days.map((day) => {
        const isToday = day === TODAY;
        const dayEvents = eventsForDay(day);
        return (
          <div key={day} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-5 py-3">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl",
                  isToday ? "bg-gradient-to-br from-brand-500 to-coral-500 text-white shadow-sm" : "bg-card text-foreground ring-1 ring-border"
                )}
              >
                <span className="text-[10px] font-semibold uppercase leading-none">{WEEKDAY_FOR_DAY(day)}</span>
                <span className="text-lg font-bold leading-tight tabular-nums">{day}</span>
              </div>
              <div className="flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  {WEEKDAY_LONG_FOR_DAY(day)}, June {day}
                  {isToday && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">Today</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dayEvents.length} {dayEvents.length === 1 ? "post" : "posts"} scheduled
                </p>
              </div>
              <Link
                href="/posts/new"
                className="hidden h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
                aria-label={`Schedule post on June ${day}`}
              >
                <Plus className="h-4 w-4" />
              </Link>
            </div>
            <ul className="divide-y divide-border">
              {dayEvents.map((ev) => (
                <li key={ev.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(ev)}
                    className={cn(
                      "flex w-full items-center gap-4 border-l-2 px-5 py-3 text-left transition-colors hover:bg-muted/40",
                      statusBorder[ev.status] ?? "border-l-slate-300"
                    )}
                  >
                    <span className="flex w-16 shrink-0 items-center gap-1 text-xs font-semibold tabular-nums text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {ev.time}
                    </span>
                    <PlatformBadge platform={ev.platform} />
                    <span className="line-clamp-1 min-w-0 flex-1 text-sm font-medium text-foreground">{ev.title}</span>
                    <ContentTypeBadge type={ev.type} className="hidden sm:inline-flex" />
                    <StatusBadge status={ev.status} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
