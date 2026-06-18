"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Shield,
  Zap,
  Play,
  Clock4,
  Users,
  MessageSquareReply,
  MessageCircle,
  UserPlus,
  Magnet,
  HelpCircle,
  Gift,
  ArrowRight,
  PowerOff,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { StatCard } from "@/components/ui/stat-card";
import { ChartCard } from "@/components/ui/chart-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Switch } from "@/components/ui/switch";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { automationLogs } from "@/lib/demo-data";
import {
  toggleAutomationActive,
  toggleAutomationApproval,
  runAutomationsAction,
} from "@/app/actions/automations";
import type { listAutomations } from "@/lib/db/automations";

type AutomationsViewProps = {
  automations: Awaited<ReturnType<typeof listAutomations>>;
  pendingApprovals: number;
  leadsCaptured: number;
  demo: boolean;
};

type AutomationType = "dm-keyword" | "comment-reply" | "lead-capture";

const typeMeta: Record<
  AutomationType,
  { label: string; icon: React.ReactNode; chip: string }
> = {
  "dm-keyword": {
    label: "DM keyword",
    icon: <MessageCircle className="h-4 w-4" />,
    chip: "bg-sky-50 text-sky-700",
  },
  "comment-reply": {
    label: "Comment auto-reply",
    icon: <MessageSquareReply className="h-4 w-4" />,
    chip: "bg-violet-50 text-violet-700",
  },
  "lead-capture": {
    label: "Lead capture",
    icon: <Magnet className="h-4 w-4" />,
    chip: "bg-emerald-50 text-emerald-700",
  },
};

const typeAccent: Record<AutomationType, string> = {
  "dm-keyword": "from-sky-500 to-blue-500",
  "comment-reply": "from-violet-500 to-indigo-500",
  "lead-capture": "from-emerald-500 to-teal-500",
};

// Enable-able templates (placeholder content — defined inline).
const templates: {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  accent: string;
}[] = [
  {
    id: "tpl-lead",
    name: "Lead magnet DM",
    desc: "Auto-send a freebie when a follower comments your keyword.",
    icon: <Magnet className="h-5 w-5" />,
    accent: "from-brand-500 to-coral-500",
  },
  {
    id: "tpl-welcome",
    name: "Welcome reply",
    desc: "Greet first-time commenters with a warm, on-brand thank-you.",
    icon: <UserPlus className="h-5 w-5" />,
    accent: "from-violet-500 to-indigo-500",
  },
  {
    id: "tpl-faq",
    name: "FAQ auto-responder",
    desc: "Reply to common questions about pricing, hours & links.",
    icon: <HelpCircle className="h-5 w-5" />,
    accent: "from-sky-500 to-cyan-500",
  },
  {
    id: "tpl-giveaway",
    name: "Giveaway entry capture",
    desc: "Log entrants who comment your giveaway keyword into a list.",
    icon: <Gift className="h-5 w-5" />,
    accent: "from-amber-400 to-orange-500",
  },
];

type LogRow = (typeof automationLogs)[number];

const logColumns: Column<LogRow>[] = [
  {
    key: "automation",
    header: "Automation",
    render: (row) => (
      <span className="inline-flex items-center gap-2 font-medium text-foreground">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
        {row.automation}
      </span>
    ),
  },
  {
    key: "event",
    header: "Event",
    render: (row) => <span className="text-muted-foreground">{row.event}</span>,
  },
  {
    key: "status",
    header: "Status",
    render: (row) => <StatusBadge status={row.status} withDot />,
  },
  {
    key: "time",
    header: "When",
    align: "right",
    render: (row) => <span className="text-xs tabular-nums text-muted-foreground">{row.time}</span>,
  },
];

export function AutomationsView({
  automations,
  pendingApprovals,
  leadsCaptured,
  demo,
}: AutomationsViewProps) {
  // Live accounts have no demo log feed yet → empty; demo shows the showcase.
  const logs = demo ? automationLogs : [];
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Manual "Run now" of the automation engine.
  const [runPending, startRunTransition] = useTransition();
  const [runNote, setRunNote] = useState<string | null>(null);

  const handleRunNow = () => {
    setError(null);
    setRunNote(null);
    startRunTransition(async () => {
      const res = await runAutomationsAction();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRunNote(
        res.matched > 0
          ? `Processed ${res.matched} item${res.matched === 1 ? "" : "s"} — ${res.autoHandled} auto-handled, ${res.drafted} awaiting approval.`
          : res.message ?? "No new inbox items matched your active automations."
      );
      router.refresh();
    });
  };

  // Local toggle state per automation so the switches feel live.
  const [toggles, setToggles] = useState(() =>
    Object.fromEntries(
      automations.map((a) => [a.id, { active: a.active, requiresApproval: a.requiresApproval }])
    )
  );

  const setToggle = (id: string, key: "active" | "requiresApproval", value: boolean) =>
    setToggles((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));

  const handleToggleActive = (id: string, value: boolean) => {
    const previous = toggles[id]?.active ?? false;
    setToggle(id, "active", value);
    setError(null);
    startTransition(async () => {
      const result = await toggleAutomationActive(id, value);
      if (!result.ok) {
        setToggle(id, "active", previous);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleToggleApproval = (id: string, value: boolean) => {
    const previous = toggles[id]?.requiresApproval ?? false;
    setToggle(id, "requiresApproval", value);
    setError(null);
    startTransition(async () => {
      const result = await toggleAutomationApproval(id, value);
      if (!result.ok) {
        setToggle(id, "requiresApproval", previous);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const activeCount = Object.values(toggles).filter((t) => t.active).length;
  const inactiveCount = automations.length - activeCount;
  const totalRuns = automations.reduce((sum, a) => sum + a.runs, 0);

  // Status filter — driven by live toggle state so it stays in sync.
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const filterOptions = [
    { value: "all", label: `All (${automations.length})` },
    { value: "active", label: `Active (${activeCount})` },
    { value: "inactive", label: `Inactive (${inactiveCount})` },
  ];

  const visibleAutomations = automations.filter((a) => {
    if (filter === "active") return toggles[a.id]?.active;
    if (filter === "inactive") return !toggles[a.id]?.active;
    return true;
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Automations"
        title="Smart, safe automation"
        description="Approval-based DM and comment automations — no spam, always in your control."
        icon={<Zap className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" onClick={handleRunNow} disabled={runPending}>
              <Play className={`h-4 w-4${runPending ? " animate-pulse" : ""}`} />
              {runPending ? "Running…" : "Run now"}
            </Button>
            <Button className="bg-gradient-to-r from-brand-500 to-coral-500 text-white shadow-sm shadow-brand-500/20 hover:opacity-95">
              <Plus className="h-4 w-4" /> Create automation
            </Button>
          </>
        }
      />

      {runNote && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          {runNote}
        </div>
      )}

      {/* Safety banner */}
      <div className="flex items-start gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-brand-50/40 p-5 shadow-soft">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm ring-1 ring-white/15">
          <Shield className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              Built to be safe, never spammy
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              <Shield className="h-3 w-3" /> Platform-compliant
            </span>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Every automation is{" "}
            <span className="font-medium text-foreground">approval-based and rate-limited</span> —
            sensitive replies wait for your sign-off, sends are throttled to human-like pacing, and
            nothing is ever mass-DMed. You stay in full control, and your accounts stay in good
            standing.
          </p>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active automations"
          value={activeCount}
          hint={`of ${automations.length} configured`}
          icon={<Zap className="h-4 w-4" />}
          accent="from-brand-500 to-coral-500"
        />
        <StatCard
          label="Total runs"
          value={totalRuns.toLocaleString()}
          hint="all time"
          icon={<Play className="h-4 w-4" />}
          accent="from-sky-500 to-blue-500"
        />
        <StatCard
          label="Pending approvals"
          value={pendingApprovals}
          hint="awaiting your review"
          icon={<Clock4 className="h-4 w-4" />}
          accent="from-amber-400 to-orange-500"
        />
        <StatCard
          label="Leads captured"
          value={leadsCaptured.toLocaleString()}
          hint="lead-capture automations"
          icon={<Users className="h-4 w-4" />}
          accent="from-emerald-500 to-teal-500"
        />
      </div>

      {/* Your automations */}
      <section className="space-y-4">
        <SectionHeader
          title="Your automations"
          description="Toggle activation and approval requirements per workflow"
          icon={<Zap className="h-4 w-4" />}
          action={
            <Segmented
              options={filterOptions}
              value={filter}
              onValueChange={(v) => setFilter(v as "all" | "active" | "inactive")}
              size="sm"
            />
          }
        />
        {error && (
          <p className="text-xs font-medium text-red-600">{error}</p>
        )}
        {visibleAutomations.length === 0 ? (
          <EmptyState
            icon={<PowerOff className="h-6 w-6" />}
            title={filter === "active" ? "No active automations" : "No inactive automations"}
            description={
              filter === "active"
                ? "Nothing is running right now. Flip on an automation below, or start from a safety-vetted template to put one to work."
                : "Every automation is currently active and working. Switch back to all to review the full list."
            }
            action={
              <Button variant="outline" size="sm" onClick={() => setFilter("all")}>
                View all automations
              </Button>
            }
          />
        ) : (
        <div className="grid items-stretch gap-4 lg:grid-cols-2">
          {visibleAutomations.map((a) => {
            const meta = typeMeta[a.type as AutomationType];
            const state = toggles[a.id];
            return (
              <div
                key={a.id}
                className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated hover:ring-1 hover:ring-brand-200/70"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${typeAccent[a.type as AutomationType]}`}
                    >
                      {meta.icon}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-foreground">{a.name}</h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.chip}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={state.active ? "active" : "inactive"} withDot />
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">{a.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1 font-mono text-[11px] text-foreground/80">
                    <Zap className="h-3 w-3 text-amber-500" /> {a.trigger}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Play className="h-3.5 w-3.5" /> {a.runs.toLocaleString()} runs
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock4 className="h-3.5 w-3.5" /> Last run {a.lastRun}
                  </span>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-3 border-t border-border pt-4">
                  <label className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2.5">
                    <span className="text-xs font-medium text-foreground">Active</span>
                    <Switch
                      checked={state.active}
                      onCheckedChange={(v) => handleToggleActive(a.id, v)}
                      aria-label={`Toggle ${a.name} active`}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2.5">
                    <span className="text-xs font-medium text-foreground">Require approval</span>
                    <Switch
                      checked={state.requiresApproval}
                      onCheckedChange={(v) => handleToggleApproval(a.id, v)}
                      aria-label={`Toggle ${a.name} approval requirement`}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </section>

      {/* Automation templates */}
      <section className="space-y-4">
        <SectionHeader
          title="Automation templates"
          description="Pre-built, safety-vetted workflows you can enable in one click"
          icon={<Plus className="h-4 w-4" />}
        />
        <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {templates.map((t) => (
            <div
              key={t.id}
              className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated hover:ring-1 hover:ring-brand-200/70"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ring-1 ring-white/15 transition-transform duration-300 group-hover:scale-105 ${t.accent}`}
              >
                {t.icon}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{t.desc}</p>
              </div>
              <Button variant="outline" size="sm" className="mt-auto">
                Use template <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Recent activity / logs */}
      <section className="space-y-4">
        <SectionHeader
          title="Recent activity"
          description="The latest automation runs and approval events"
          icon={<Clock4 className="h-4 w-4" />}
        />
        <ChartCard
          title="Automation logs"
          subtitle="Most recent events"
          bodyClassName="p-0"
          action={
            <Button variant="ghost" size="xs" className="text-muted-foreground">
              View full history <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          }
          footer={
            <span>
              {logs.length} recent events ·{" "}
              {logs.filter((l) => l.status === "success").length} succeeded ·{" "}
              {logs.filter((l) => l.status === "pending").length} awaiting approval
            </span>
          }
        >
          <DataTable
            columns={logColumns}
            data={logs}
            getRowKey={(row) => row.id}
            empty="No automation activity yet."
          />
        </ChartCard>
      </section>
    </div>
  );
}
