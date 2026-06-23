"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Send,
  UserPlus,
  Check,
  X,
  FileText,
  Inbox as InboxIcon,
  MessageSquare,
  Smile,
  Clock3,
  ArrowUpRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { Segmented } from "@/components/ui/segmented";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { InboxThread } from "@/components/ui/inbox-thread";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { platformMeta } from "@/lib/demo-data";
import { markReplied, markIgnored, saveReplyDraft, sendReply, syncInboxAction } from "@/app/actions/inbox";
import type { listInbox } from "@/lib/db/inbox";

type InboxViewProps = { threads: Awaited<ReturnType<typeof listInbox>> };

const TABS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "comments", label: "Comments" },
  { value: "dms", label: "DMs" },
  { value: "mentions", label: "Mentions" },
];

const platformOptions = [
  { value: "all", label: "All platforms" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" },
  { value: "x", label: "X" },
];

const typeLabel: Record<string, string> = { comment: "Comment", dm: "Direct message", mention: "Mention" };

export function InboxView({ threads }: InboxViewProps) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState("all");
  const [selectedId, setSelectedId] = useState(threads[0]?.id ?? "");
  const [platform, setPlatform] = useState("all");
  const [reply, setReply] = useState("");
  const [pending, startTransition] = useTransition();
  const [isSyncing, startSync] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSync() {
    setError(null);
    startSync(async () => {
      const res = await syncInboxAction();
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  const filtered = useMemo(() => {
    return threads.filter((t) => {
      if (platform !== "all" && t.platform !== platform) return false;
      switch (tab) {
        case "unread":
          return t.status === "new";
        case "comments":
          return t.type === "comment";
        case "dms":
          return t.type === "dm";
        case "mentions":
          return t.type === "mention";
        default:
          return true;
      }
    });
  }, [tab, platform, threads]);

  const selected = threads.find((t) => t.id === selectedId) ?? null;
  const unreadCount = threads.filter((t) => t.status === "new").length;
  const positiveCount = threads.filter((t) => t.sentiment === "positive").length;
  const repliedCount = threads.filter((t) => t.status === "replied").length;
  const positivePct = threads.length ? Math.round((positiveCount / threads.length) * 100) : 0;
  const isFiltered = tab !== "all" || platform !== "all";

  const resetFilters = () => {
    setTab("all");
    setPlatform("all");
  };

  const runAction = (action: () => Promise<{ ok: true } | { ok: false; error: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleMarkReplied = () => {
    if (!selected) return;
    runAction(() => markReplied(selected.id));
  };

  const handleIgnore = () => {
    if (!selected) return;
    runAction(() => markIgnored(selected.id));
  };

  const handleSaveDraft = () => {
    if (!selected || !reply.trim()) return;
    runAction(() => saveReplyDraft(selected.id, reply));
  };

  const handleSendReply = () => {
    if (!selected || !reply.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await sendReply(selected.id, reply);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setReply("");
      router.refresh();
    });
  };

  const handleUseSuggestion = () => {
    if (!selected) return;
    const suggestion = selected.suggestedReply ?? "";
    setReply(suggestion);
    if (!suggestion.trim()) return;
    runAction(() => saveReplyDraft(selected.id, suggestion));
  };

  // Clear every unread (new) conversation at once by marking them replied.
  const handleMarkAllRead = () => {
    const unread = threads.filter((t) => t.status === "new");
    if (unread.length === 0) {
      toast({ variant: "info", title: "Inbox zero", description: "No unread conversations to clear." });
      return;
    }
    setError(null);
    startTransition(async () => {
      const results = await Promise.all(unread.map((t) => markReplied(t.id)));
      const failed = results.filter((r) => !r.ok).length;
      router.refresh();
      if (failed > 0) {
        toast({
          variant: "error",
          title: "Some couldn't be updated",
          description: `${unread.length - failed} of ${unread.length} marked as read.`,
        });
      } else {
        toast({
          variant: "success",
          title: "Inbox marked read",
          description: `${unread.length} conversation${unread.length === 1 ? "" : "s"} cleared.`,
        });
      }
    });
  };

  const summary = [
    { label: "Unread", value: unreadCount, icon: <MessageSquare className="h-4 w-4" />, tint: "bg-brand-50 text-brand-600" },
    { label: "Positive", value: `${positivePct}%`, icon: <Smile className="h-4 w-4" />, tint: "bg-emerald-50 text-emerald-600" },
    { label: "Replied", value: repliedCount, icon: <Check className="h-4 w-4" />, tint: "bg-sky-50 text-sky-600" },
    { label: "Avg. response", value: "12m", icon: <Clock3 className="h-4 w-4" />, tint: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Engagement"
        icon={<InboxIcon className="h-5 w-5" />}
        title="Unified Inbox"
        description="Comments, mentions and DMs across every platform — in one place."
        actions={
          <>
            <SelectField
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              options={platformOptions}
              className="w-40"
            />
            <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
              <RefreshCw className={`h-4 w-4${isSyncing ? " animate-spin" : ""}`} />
              {isSyncing ? "Syncing…" : "Sync"}
            </Button>
            <Button variant="outline" onClick={handleMarkAllRead} disabled={pending}>
              <Check className="h-4 w-4" /> Mark all read
            </Button>
          </>
        }
      />

      {/* At-a-glance summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summary.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${s.tint}`}>
              {s.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold tabular-nums text-foreground">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* LEFT: thread list */}
        <section className="flex h-auto flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:col-span-5 xl:col-span-4 lg:h-[calc(100vh-17rem)]">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Conversations</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              {unreadCount} unread
            </span>
          </div>
          <div className="border-b border-border px-4 py-3">
            <Segmented options={TABS} value={tab} onValueChange={setTab} size="sm" className="w-full" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<InboxIcon className="h-6 w-6" />}
                  title="Inbox zero on this filter"
                  description="No conversations match the selected tab or platform. Try widening your view."
                  action={
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                      <X className="h-4 w-4" /> Clear filters
                    </Button>
                  }
                />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((t) => (
                  <li key={t.id}>
                    <InboxThread
                      thread={t}
                      selected={t.id === selectedId}
                      onClick={() => setSelectedId(t.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
            <span>
              {filtered.length} {filtered.length === 1 ? "conversation" : "conversations"}
              {isFiltered && " · filtered"}
            </span>
            {isFiltered && (
              <button
                type="button"
                onClick={resetFilters}
                className="font-semibold text-brand-600 transition-colors hover:text-brand-700"
              >
                Clear
              </button>
            )}
          </div>
        </section>

        {/* RIGHT: detail */}
        <section className="flex h-auto flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:col-span-7 xl:col-span-8 lg:h-[calc(100vh-17rem)]">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState
                icon={<InboxIcon className="h-6 w-6" />}
                title="Select a conversation"
                description="Pick a thread on the left to view it and reply."
              />
            </div>
          ) : (
            <>
              {/* Header */}
              <header className="flex items-center justify-between gap-3 border-b border-border bg-muted/20 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative">
                    <Avatar initials={selected.initials} gradient="from-slate-400 to-slate-600" size="lg" />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-card text-foreground/70 ring-1 ring-border">
                      <PlatformIcon platform={selected.platform} className="h-3 w-3" />
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{selected.author}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selected.handle} · {platformMeta[selected.platform].label} · {typeLabel[selected.type]}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selected.sentiment} withDot />
                    <StatusBadge status={selected.status} />
                  </div>
                  <span className="hidden text-[11px] text-muted-foreground sm:inline">{selected.time}</span>
                </div>
              </header>

              {/* Body */}
              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {/* Message bubble */}
                <div className="flex items-start gap-3">
                  <Avatar initials={selected.initials} gradient="from-slate-400 to-slate-600" size="sm" />
                  <div className="min-w-0">
                    <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-border bg-muted/40 px-4 py-3">
                      <p className="text-sm leading-relaxed text-foreground">{selected.preview}</p>
                    </div>
                    <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">{selected.author} · {selected.time}</p>
                  </div>
                </div>

                {/* Related post */}
                {selected.relatedPost && (
                  <div className="group rounded-xl border border-border bg-card p-3 transition-colors hover:border-brand-200 hover:bg-muted/30">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      In reply to your post
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-coral-500 text-white shadow-sm">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{selected.relatedPost}</p>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <PlatformIcon platform={selected.platform} className="h-3 w-3" />
                          {platformMeta[selected.platform].label}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-brand-500" />
                    </div>
                  </div>
                )}

                {/* AI suggested reply */}
                {selected.suggestedReply && (
                  <div className="rounded-xl bg-gradient-to-br from-brand-50/80 to-coral-50/50 p-4 ring-1 ring-brand-200">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                        <Sparkles className="h-3.5 w-3.5" /> AI suggested reply
                      </span>
                      <Button
                        size="xs"
                        variant="gradient"
                        onClick={handleUseSuggestion}
                        disabled={pending}
                      >
                        <Sparkles className="h-3 w-3" /> Use suggestion
                      </Button>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/80">{selected.suggestedReply}</p>
                    <p className="mt-2 flex items-center gap-1 text-[11px] text-brand-600/70">
                      <ArrowUpRight className="h-3 w-3" /> Tuned to your brand voice and this thread&apos;s sentiment.
                    </p>
                  </div>
                )}
              </div>

              {/* Reply composer + actions */}
              <footer className="space-y-3 border-t border-border bg-muted/20 p-4">
                {error && (
                  <p className="text-xs font-medium text-red-600">{error}</p>
                )}
                <div className="flex items-end gap-2">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={`Reply to ${selected.author}…`}
                    className="min-h-11 flex-1 resize-none bg-card"
                    rows={1}
                  />
                  <Button
                    variant="outline"
                    className="h-11 shrink-0"
                    disabled={!reply.trim() || pending}
                    onClick={handleSaveDraft}
                    title="Save as draft"
                  >
                    Draft
                  </Button>
                  <Button
                    variant="gradient"
                    className="h-11 shrink-0"
                    disabled={!reply.trim() || pending}
                    onClick={handleSendReply}
                  >
                    <Send className="h-4 w-4" /> Send
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleMarkReplied} disabled={pending}>
                      <Check className="h-4 w-4" /> Mark as replied
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleIgnore} disabled={pending}>
                      <X className="h-4 w-4" /> Ignore
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        toast({
                          variant: "info",
                          title: "Assignment is coming soon",
                          description: "Soon you'll be able to route this conversation to a teammate.",
                        })
                      }
                    >
                      <UserPlus className="h-4 w-4" /> Assign
                    </Button>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Replying as <span className="font-medium text-foreground">{platformMeta[selected.platform].label}</span>
                  </span>
                </div>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
