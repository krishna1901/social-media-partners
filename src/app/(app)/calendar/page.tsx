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
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { SelectField } from "@/components/ui/select-field";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { ContentTypeBadge } from "@/components/ui/content-type-badge";
import { Drawer } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { calendarEvents, platformMeta, type Platform } from "@/lib/demo-data";

type CalendarEvent = (typeof calendarEvents)[number];

const TODAY = 17;
const DAYS_IN_MONTH = 30; // June 2026
const FIRST_WEEKDAY = 1; // June 1, 2026 is Monday (Sunday-start grid → index 1)
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
const statusOptions = ["All", "Scheduled", "Draft", "Ready", "Posted"];

function eventsForDay(day: number) {
  return calendarEvents
    .filter((e) => e.day === day)
    .sort((a, b) => a.time.localeCompare(b.time));
}

export default function ContentCalendarPage() {
  const [view, setView] = useState("month");
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

  // Build the month grid with leading blanks (Sunday-start).
  const cells = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < FIRST_WEEKDAY; i++) arr.push(null);
    for (let d = 1; d <= DAYS_IN_MONTH; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, []);

  const agendaDays = useMemo(
    () => Array.from(new Set(calendarEvents.map((e) => e.day))).sort((a, b) => a - b),
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Calendar"
        description="Plan and schedule your content across platforms."
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
              <Button className="bg-gradient-to-r from-brand-500 to-coral-500 text-white shadow-sm shadow-brand-500/20 hover:from-brand-600 hover:to-coral-600">
                <CalendarPlus className="h-4 w-4" /> Schedule post
              </Button>
            </Link>
          </>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="min-w-[140px] text-center text-sm font-semibold tracking-tight text-foreground">
            June 2026
          </h2>
          <Button variant="outline" size="icon-sm" aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="ml-1 text-muted-foreground">
            Today
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SelectField options={platformOptions} defaultValue="all" className="w-44" aria-label="Filter by platform" />
          <SelectField options={statusOptions} defaultValue="All" className="w-36" aria-label="Filter by status" />
        </div>
      </div>

      {view === "month" && (
        <MonthView cells={cells} onSelect={setSelected} />
      )}
      {view === "week" && <WeekView onSelect={setSelected} />}
      {view === "agenda" && <AgendaView days={agendaDays} onSelect={setSelected} />}

      {/* Event detail drawer */}
      <Drawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.title}
        description={selected ? `June ${selected.day}, 2026 · ${selected.time}` : undefined}
        footer={
          selected && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Repeat className="h-4 w-4" /> Reschedule
              </Button>
              <Link href="/posts/new" className="flex-1">
                <Button size="sm" className="w-full bg-gradient-to-r from-brand-500 to-coral-500 text-white hover:from-brand-600 hover:to-coral-600">
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

            <dl className="grid grid-cols-2 gap-3">
              {[
                { label: "Date", value: `June ${selected.day}, 2026` },
                { label: "Time", value: selected.time },
                { label: "Platform", value: platformMeta[selected.platform].label },
                { label: "Format", value: selected.type },
              ].map((row) => (
                <div key={row.label} className="rounded-xl border border-border bg-muted/30 px-3 py-2">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{row.label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold capitalize text-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs font-semibold text-foreground">Publishing window</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Queued to publish at {selected.time} on June {selected.day}.
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* --------------------------------- month ---------------------------------- */

function MonthView({
  cells,
  onSelect,
}: {
  cells: (number | null)[];
  onSelect: (e: CalendarEvent) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto scrollbar-thin">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`b-${i}`} className="min-h-[112px] border-b border-r border-border bg-muted/10 last:border-r-0" />;
          }
          const dayEvents = eventsForDay(day);
          const isToday = day === TODAY;
          return (
            <div
              key={day}
              className={cn(
                "group/cell relative min-h-[112px] border-b border-r border-border p-1.5 transition-colors hover:bg-muted/20 [&:nth-child(7n)]:border-r-0",
                isToday && "bg-brand-50/40"
              )}
            >
              <div className="flex items-center justify-between px-1">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    isToday ? "bg-gradient-to-br from-brand-500 to-coral-500 text-white shadow-sm" : "text-foreground"
                  )}
                >
                  {day}
                </span>
                <Link
                  href="/posts/new"
                  className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover/cell:opacity-100"
                  aria-label={`Schedule post on June ${day}`}
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
                      "flex w-full cursor-grab items-center gap-1.5 rounded-md border-l-2 bg-muted/50 px-1.5 py-1 text-left transition-colors hover:bg-muted active:cursor-grabbing",
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

function WeekView({ onSelect }: { onSelect: (e: CalendarEvent) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto scrollbar-thin">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-border bg-muted/30">
        <div className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Time</div>
        {WEEK_DAYS.map((day, i) => {
          const isToday = day === TODAY;
          return (
            <div key={day} className="border-l border-border px-2 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{WEEKDAYS[i]}</p>
              <p className={cn("text-sm font-bold", isToday ? "text-brand-600" : "text-foreground")}>{day}</p>
            </div>
          );
        })}
      </div>
      <div className="max-h-[560px] overflow-y-auto scrollbar-thin">
        {HOURS.map((h) => (
          <div key={h} className="grid min-h-[72px] grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-border last:border-b-0">
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
                        "mb-1 flex w-full flex-col gap-0.5 rounded-md border-l-2 bg-muted/50 px-1.5 py-1 text-left transition-colors hover:bg-muted",
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

const WEEKDAY_FOR_DAY = (day: number) => WEEKDAYS[(FIRST_WEEKDAY + day - 1) % 7];

function AgendaView({ days, onSelect }: { days: number[]; onSelect: (e: CalendarEvent) => void }) {
  return (
    <div className="space-y-4">
      {days.map((day) => {
        const isToday = day === TODAY;
        return (
          <div key={day} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-5 py-3">
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl",
                  isToday ? "bg-gradient-to-br from-brand-500 to-coral-500 text-white shadow-sm" : "bg-card text-foreground ring-1 ring-border"
                )}
              >
                <span className="text-[10px] font-semibold uppercase leading-none">{WEEKDAY_FOR_DAY(day)}</span>
                <span className="text-base font-bold leading-tight">{day}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {WEEKDAY_FOR_DAY(day)}, June {day}
                  {isToday && <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">Today</span>}
                </p>
                <p className="text-xs text-muted-foreground">{eventsForDay(day).length} scheduled</p>
              </div>
            </div>
            <ul className="divide-y divide-border">
              {eventsForDay(day).map((ev) => (
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
                    <span className="min-w-0 flex-1 line-clamp-1 text-sm font-medium text-foreground">{ev.title}</span>
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
