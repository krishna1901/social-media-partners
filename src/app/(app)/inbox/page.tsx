"use client";

import { useMemo, useState } from "react";
import { Sparkles, Send, UserPlus, Check, X, FileText, Inbox as InboxIcon } from "lucide-react";
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
import { inboxThreads, platformMeta } from "@/lib/demo-data";

const TABS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "comments", label: "Comments" },
  { value: "dms", label: "DMs" },
  { value: "mentions", label: "Mentions" },
];

const typeLabel: Record<string, string> = { comment: "Comment", dm: "Direct message", mention: "Mention" };

export default function InboxPage() {
  const [tab, setTab] = useState("all");
  const [selectedId, setSelectedId] = useState(inboxThreads[0].id);
  const [platform, setPlatform] = useState("all");
  const [reply, setReply] = useState("");

  const filtered = useMemo(() => {
    return inboxThreads.filter((t) => {
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
  }, [tab, platform]);

  const selected = inboxThreads.find((t) => t.id === selectedId) ?? null;
  const unreadCount = inboxThreads.filter((t) => t.status === "new").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unified Inbox"
        description="Comments, mentions and DMs across every platform — in one place."
        actions={
          <>
            <SelectField
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              options={[
                { value: "all", label: "All platforms" },
                { value: "instagram", label: "Instagram" },
                { value: "linkedin", label: "LinkedIn" },
                { value: "tiktok", label: "TikTok" },
                { value: "x", label: "X" },
              ]}
              className="w-40"
            />
            <Button variant="ghost">
              <Check className="h-4 w-4" /> Mark all read
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-12">
        {/* LEFT: thread list */}
        <section className="flex h-auto flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:col-span-5 xl:col-span-4 lg:h-[calc(100vh-13rem)]">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              Conversations
              <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                {unreadCount} unread
              </span>
            </h2>
          </div>
          <div className="border-b border-border px-4 py-3">
            <Segmented options={TABS} value={tab} onValueChange={setTab} size="sm" className="w-full" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<InboxIcon className="h-6 w-6" />}
                  title="Nothing here"
                  description="No conversations match this filter. Try another tab or platform."
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
        </section>

        {/* RIGHT: detail */}
        <section className="flex h-auto flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:col-span-7 xl:col-span-8 lg:h-[calc(100vh-13rem)]">
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
              <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
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
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={selected.sentiment} withDot />
                  <StatusBadge status={selected.status} />
                  <span className="hidden text-xs text-muted-foreground sm:inline">{selected.time}</span>
                </div>
              </header>

              {/* Body */}
              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {/* Message bubble */}
                <div className="flex items-start gap-3">
                  <Avatar initials={selected.initials} gradient="from-slate-400 to-slate-600" size="sm" />
                  <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-border bg-muted/40 px-4 py-3">
                    <p className="text-sm leading-relaxed text-foreground">{selected.preview}</p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">{selected.time}</p>
                  </div>
                </div>

                {/* Related post */}
                {selected.relatedPost && (
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Related post
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-coral-500 text-white">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{selected.relatedPost}</p>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <PlatformIcon platform={selected.platform} className="h-3 w-3" />
                          {platformMeta[selected.platform].label}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI suggested reply */}
                {selected.suggestedReply && (
                  <div className="rounded-xl bg-brand-50/60 p-4 ring-1 ring-brand-200">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                        <Sparkles className="h-3.5 w-3.5" /> AI suggested reply
                      </span>
                      <Button
                        size="xs"
                        className="bg-gradient-to-r from-brand-500 to-coral-500 text-white hover:opacity-90"
                        onClick={() => setReply(selected.suggestedReply ?? "")}
                      >
                        <Sparkles className="h-3 w-3" /> Use suggestion
                      </Button>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/80">{selected.suggestedReply}</p>
                  </div>
                )}
              </div>

              {/* Reply composer + actions */}
              <footer className="space-y-3 border-t border-border bg-muted/20 p-4">
                <div className="flex items-end gap-2">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={`Reply to ${selected.author}…`}
                    className="min-h-11 flex-1 resize-none bg-card"
                    rows={1}
                  />
                  <Button className="h-11 shrink-0" disabled={!reply.trim()}>
                    <Send className="h-4 w-4" /> Send
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Check className="h-4 w-4" /> Mark as replied
                  </Button>
                  <Button variant="ghost" size="sm">
                    <X className="h-4 w-4" /> Mark as ignored
                  </Button>
                  <Button variant="ghost" size="sm">
                    <UserPlus className="h-4 w-4" /> Assign
                  </Button>
                </div>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
