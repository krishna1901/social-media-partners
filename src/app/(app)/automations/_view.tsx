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
  MessageCircle,
  Layers,
  Repeat,
  ImagePlus,
  AlertTriangle,
  Lightbulb,
  Target,
  ArrowRight,
  PowerOff,
  Pencil,
  Trash2,
  FlaskConical,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select-field";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  toggleAutomationActive,
  toggleAutomationApproval,
  deleteAutomation,
  createAutomation,
  updateAutomation,
  runAutomationsAction,
  dryRunRuleAction,
} from "@/app/actions/automations";
import type { AutomationListItem, AutomationLogItem } from "@/lib/db/automations";
import {
  TRIGGER_TYPES,
  TRIGGER_META,
  ACTION_LABEL,
  AUTOMATION_TEMPLATES,
  type AutomationTriggerType,
  type AutomationTemplate,
} from "@/lib/automations/constants";

type AutomationsViewProps = {
  automations: AutomationListItem[];
  logs: AutomationLogItem[];
  pendingApprovals: number;
  pendingActions: number;
  leadsCaptured: number;
  demo: boolean;
};

/* ------------------------------ visual metadata ------------------------------ */

const triggerIcon: Record<AutomationTriggerType, React.ReactNode> = {
  "inbox-keyword": <MessageCircle className="h-4 w-4" />,
  "content-pool-queue": <Layers className="h-4 w-4" />,
  "recurring-post": <Repeat className="h-4 w-4" />,
  "media-to-draft": <ImagePlus className="h-4 w-4" />,
  "failed-publish-alert": <AlertTriangle className="h-4 w-4" />,
  "idea-ready-to-draft": <Lightbulb className="h-4 w-4" />,
  "competitor-post-to-idea": <Target className="h-4 w-4" />,
};

const triggerAccent: Record<AutomationTriggerType, string> = {
  "inbox-keyword": "from-sky-500 to-blue-500",
  "content-pool-queue": "from-brand-500 to-coral-500",
  "recurring-post": "from-violet-500 to-indigo-500",
  "media-to-draft": "from-fuchsia-500 to-purple-600",
  "failed-publish-alert": "from-amber-500 to-orange-600",
  "idea-ready-to-draft": "from-emerald-500 to-teal-500",
  "competitor-post-to-idea": "from-rose-500 to-pink-600",
};

// Legacy DM types (demo + pre-existing rows without a trigger_type).
const legacyMeta: Record<string, { label: string; accent: string }> = {
  "dm-keyword": { label: "DM keyword", accent: "from-sky-500 to-blue-500" },
  "comment-reply": { label: "Comment auto-reply", accent: "from-violet-500 to-indigo-500" },
  "lead-capture": { label: "Lead capture", accent: "from-emerald-500 to-teal-500" },
};

function cardMeta(a: AutomationListItem): { label: string; icon: React.ReactNode; accent: string } {
  if (a.triggerType && TRIGGER_META[a.triggerType]) {
    return {
      label: TRIGGER_META[a.triggerType].label,
      icon: triggerIcon[a.triggerType],
      accent: triggerAccent[a.triggerType],
    };
  }
  const m = legacyMeta[a.type] ?? legacyMeta["dm-keyword"];
  return { label: m.label, icon: <MessageCircle className="h-4 w-4" />, accent: m.accent };
}

/* --------------------------------- log table -------------------------------- */

const logColumns: Column<AutomationLogItem>[] = [
  {
    key: "rule",
    header: "Automation",
    render: (row) => (
      <span className="inline-flex items-center gap-2 font-medium text-foreground">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
        {row.rule}
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

/* ----------------------------------- form ----------------------------------- */

interface FormState {
  id?: string;
  name: string;
  triggerType: AutomationTriggerType;
  description: string;
  values: Record<string, string>;
  requiresApproval: boolean;
  active: boolean;
}

function emptyForm(): FormState {
  const tt = TRIGGER_TYPES[0];
  return {
    name: "",
    triggerType: tt,
    description: TRIGGER_META[tt].description,
    values: {},
    requiresApproval: TRIGGER_META[tt].approvalDefault,
    active: false,
  };
}

/** Build a short human-readable trigger label for the card chip. */
function triggerLabel(triggerType: AutomationTriggerType, values: Record<string, string>): string {
  if (values.keyword) return `Keyword: ${values.keyword}`;
  if (values.frequency) return `Every ${values.frequency}`;
  return TRIGGER_META[triggerType].label;
}

export function AutomationsView({
  automations,
  logs,
  pendingApprovals,
  pendingActions,
  leadsCaptured,
  demo,
}: AutomationsViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // "Run now" of the full automation engine.
  const [runPending, startRunTransition] = useTransition();
  const [runNote, setRunNote] = useState<string | null>(null);

  // Per-rule dry-run (test) result.
  const [testingId, setTestingId] = useState<string | null>(null);
  const [dryNote, setDryNote] = useState<{ id: string; message: string } | null>(null);

  // Create / edit dialog.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, startSubmitTransition] = useTransition();

  // Local toggle state per automation so the switches feel live.
  const [toggles, setToggles] = useState(() =>
    Object.fromEntries(
      automations.map((a) => [a.id, { active: a.active, requiresApproval: a.requiresApproval }])
    )
  );

  const setToggle = (id: string, key: "active" | "requiresApproval", value: boolean) =>
    setToggles((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));

  const handleRunNow = () => {
    setError(null);
    setRunNote(null);
    startRunTransition(async () => {
      const res = await runAutomationsAction();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRunNote(res.message);
      router.refresh();
    });
  };

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

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Delete automation “${name}”? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteAutomation(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleTest = (id: string) => {
    setError(null);
    setDryNote(null);
    setTestingId(id);
    startTransition(async () => {
      const res = await dryRunRuleAction(id);
      setTestingId(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDryNote({ id, message: res.message });
    });
  };

  /* ------------------------------ dialog helpers ----------------------------- */

  const openCreate = () => {
    setFormError(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openFromTemplate = (t: AutomationTemplate) => {
    setFormError(null);
    const values: Record<string, string> = {};
    for (const [k, v] of Object.entries(t.conditions)) values[k] = String(v);
    for (const [k, v] of Object.entries(t.actionConfig)) values[k] = String(v);
    setForm({
      name: t.name,
      triggerType: t.triggerType,
      description: t.description,
      values,
      requiresApproval: t.approvalRequired,
      active: false,
    });
    setDialogOpen(true);
  };

  const openEdit = (a: AutomationListItem) => {
    setFormError(null);
    const tt: AutomationTriggerType = a.triggerType ?? TRIGGER_TYPES[0];
    const values: Record<string, string> = {};
    for (const [k, v] of Object.entries(a.conditions)) values[k] = String(v);
    for (const [k, v] of Object.entries(a.actionConfig)) values[k] = String(v);
    setForm({
      id: a.id,
      name: a.name,
      triggerType: tt,
      description: a.description,
      values,
      requiresApproval: a.requiresApproval,
      active: a.active,
    });
    setDialogOpen(true);
  };

  const setTrigger = (tt: AutomationTriggerType) =>
    setForm((prev) => ({
      ...prev,
      triggerType: tt,
      // Reset config when the trigger changes; keep the existing approval intent
      // only when the user already chose a non-default.
      values: {},
      requiresApproval: TRIGGER_META[tt].approvalDefault,
      description: prev.description || TRIGGER_META[tt].description,
    }));

  const setValue = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, values: { ...prev.values, [key]: value } }));

  const handleSubmit = () => {
    setFormError(null);
    if (!form.name.trim()) {
      setFormError("Give your automation a name.");
      return;
    }
    const meta = TRIGGER_META[form.triggerType];
    const conditions: Record<string, unknown> = {};
    const actionConfig: Record<string, unknown> = {};
    for (const f of meta.fields) {
      const [bucket, leaf] = f.key.split(".");
      const raw = (form.values[leaf] ?? "").trim();
      if (!raw) continue;
      const value: unknown = f.kind === "number" ? Number(raw) : raw;
      if (f.kind === "number" && !Number.isFinite(value)) continue;
      (bucket === "conditions" ? conditions : actionConfig)[leaf] = value;
    }

    const payload = {
      name: form.name.trim(),
      triggerType: form.triggerType,
      actionType: meta.action,
      description: form.description.trim() || meta.description,
      trigger: triggerLabel(form.triggerType, form.values),
      conditions,
      actionConfig,
      requiresApproval: form.requiresApproval,
      active: form.active,
    };

    startSubmitTransition(async () => {
      const res = form.id
        ? await updateAutomation(form.id, payload)
        : await createAutomation(payload);
      if (!res.ok) {
        setFormError(res.error);
        return;
      }
      setDialogOpen(false);
      router.refresh();
    });
  };

  /* ------------------------------- derived state ----------------------------- */

  const activeCount = Object.values(toggles).filter((t) => t.active).length;
  const inactiveCount = automations.length - activeCount;

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

  const meta = TRIGGER_META[form.triggerType];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Automations"
        title="Smart, safe automation"
        description="Approval-based rules that draft, queue and alert — no spam, always in your control."
        icon={<Zap className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" onClick={handleRunNow} disabled={runPending}>
              <Play className={`h-4 w-4${runPending ? " animate-pulse" : ""}`} />
              {runPending ? "Running…" : "Run now"}
            </Button>
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-brand-500 to-coral-500 text-white shadow-sm shadow-brand-500/20 hover:opacity-95"
            >
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
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      {/* Safety banner */}
      <div className="flex items-start gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-brand-50/40 p-5 shadow-soft">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm ring-1 ring-white/15">
          <Shield className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Built to be safe, never spammy</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              <Shield className="h-3 w-3" /> Platform-compliant
            </span>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Automations only perform{" "}
            <span className="font-medium text-foreground">safe internal actions</span> — drafting
            posts, queueing, suggesting replies and alerting. Nothing is ever auto-sent to a follower
            and nothing publishes to a platform without your approval. Test any rule with a dry run
            before turning it on.
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
          label="Pending actions"
          value={pendingActions}
          hint="awaiting approval"
          icon={<Clock4 className="h-4 w-4" />}
          accent="from-amber-400 to-orange-500"
        />
        <StatCard
          label="Inbox to review"
          value={pendingApprovals}
          hint="suggested replies"
          icon={<MessageCircle className="h-4 w-4" />}
          accent="from-sky-500 to-blue-500"
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
          description="Create, edit, test and toggle approval per workflow"
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
        {visibleAutomations.length === 0 ? (
          <EmptyState
            icon={<PowerOff className="h-6 w-6" />}
            title={filter === "active" ? "No active automations" : filter === "inactive" ? "No inactive automations" : "No automations yet"}
            description={
              filter === "all"
                ? "Create your first rule, or start from a safety-vetted template below."
                : "Switch back to all to review the full list."
            }
            action={
              filter === "all" ? (
                <Button variant="outline" size="sm" onClick={openCreate}>
                  <Plus className="h-3.5 w-3.5" /> Create automation
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setFilter("all")}>
                  View all automations
                </Button>
              )
            }
          />
        ) : (
          <div className="grid items-stretch gap-4 lg:grid-cols-2">
            {visibleAutomations.map((a) => {
              const m = cardMeta(a);
              const state = toggles[a.id] ?? { active: a.active, requiresApproval: a.requiresApproval };
              const action = a.actionType ? ACTION_LABEL[a.actionType] : "Suggested reply";
              return (
                <div
                  key={a.id}
                  className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated hover:ring-1 hover:ring-brand-200/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${m.accent}`}
                      >
                        {m.icon}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-foreground">{a.name}</h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground/70">
                          {m.label}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={state.active ? "active" : "inactive"} withDot />
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">{a.description}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1 font-mono text-[11px] text-foreground/80">
                      <Zap className="h-3 w-3 text-amber-500" /> {a.trigger || m.label}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-[11px]">
                      <ArrowRight className="h-3 w-3" /> {action}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Play className="h-3.5 w-3.5" /> {a.runs.toLocaleString()} runs
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock4 className="h-3.5 w-3.5" /> {a.lastRun}
                    </span>
                  </div>

                  {dryNote?.id === a.id && (
                    <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
                      <span className="font-semibold">Dry run:</span> {dryNote.message}
                    </div>
                  )}

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

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleTest(a.id)}
                      disabled={testingId === a.id}
                    >
                      <FlaskConical className="h-3.5 w-3.5" />
                      {testingId === a.id ? "Testing…" : "Test (dry run)"}
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => openEdit(a)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete"
                      onClick={() => handleDelete(a.id, a.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
          description="Pre-built, safety-vetted workflows — one click to prefill the form"
          icon={<Plus className="h-4 w-4" />}
        />
        <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {AUTOMATION_TEMPLATES.map((t) => (
            <div
              key={t.id}
              className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated hover:ring-1 hover:ring-brand-200/70"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ring-1 ring-white/15 transition-transform duration-300 group-hover:scale-105 ${triggerAccent[t.triggerType]}`}
              >
                {triggerIcon[t.triggerType]}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{t.description}</p>
              </div>
              <Button variant="outline" size="sm" className="mt-auto" onClick={() => openFromTemplate(t)}>
                Use template <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Logs */}
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
            empty="No automation activity yet. Create a rule and run it to see logs here."
          />
        </ChartCard>
      </section>

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit automation" : "Create automation"}</DialogTitle>
            <DialogDescription>
              Choose a trigger and a safe action. {demo && "Sign in to a workspace to save changes."}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Name</label>
              <Input
                value={form.name}
                placeholder="e.g. Weekly thought leadership"
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Trigger</label>
              <SelectField
                value={form.triggerType}
                onChange={(e) => setTrigger(e.target.value as AutomationTriggerType)}
                options={TRIGGER_TYPES.map((tt) => ({ value: tt, label: TRIGGER_META[tt].label }))}
              />
              <p className="text-[11px] text-muted-foreground">{meta.description}</p>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Action:</span> {ACTION_LABEL[meta.action]}
              {meta.canPublish && (
                <span className="ml-1">
                  — gated by approval; nothing publishes without your sign-off.
                </span>
              )}
            </div>

            {/* Dynamic condition / config fields */}
            {meta.fields.map((f) => {
              const [, leaf] = f.key.split(".");
              const value = form.values[leaf] ?? "";
              return (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    {f.label}
                    {f.optional && <span className="ml-1 text-muted-foreground">(optional)</span>}
                  </label>
                  {f.kind === "textarea" ? (
                    <Textarea
                      value={value}
                      placeholder={f.placeholder}
                      onChange={(e) => setValue(leaf, e.target.value)}
                    />
                  ) : f.kind === "select" ? (
                    <SelectField
                      value={value}
                      options={f.options ?? []}
                      onChange={(e) => setValue(leaf, e.target.value)}
                    />
                  ) : (
                    <Input
                      type={f.kind === "number" ? "number" : "text"}
                      value={value}
                      placeholder={f.placeholder}
                      onChange={(e) => setValue(leaf, e.target.value)}
                    />
                  )}
                  {f.help && <p className="text-[11px] text-muted-foreground">{f.help}</p>}
                </div>
              );
            })}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2.5">
                <span className="text-xs font-medium text-foreground">Require approval</span>
                <Switch
                  checked={form.requiresApproval}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, requiresApproval: v }))}
                  aria-label="Require approval"
                />
              </label>
              <label className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2.5">
                <span className="text-xs font-medium text-foreground">Active</span>
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, active: v }))}
                  aria-label="Active"
                />
              </label>
            </div>

            {formError && <p className="text-xs font-medium text-red-600">{formError}</p>}
          </div>

          <DialogFooter showCloseButton>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving…" : form.id ? "Save changes" : "Create automation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
