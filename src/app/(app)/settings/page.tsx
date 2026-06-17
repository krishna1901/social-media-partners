"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Building2,
  Palette,
  Sparkles,
  Webhook,
  Bell,
  Clock,
  Plug,
  Save,
  Send,
  Plus,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SelectField } from "@/components/ui/select-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { PlatformBadge } from "@/components/ui/platform-badge";
import {
  settingsDefaults,
  connectedChannels,
  studioToneOptions,
  type Platform,
} from "@/lib/demo-data";

type SectionId =
  | "profile"
  | "workspace"
  | "brand"
  | "ai"
  | "webhooks"
  | "notifications"
  | "posting"
  | "channels";

const sections: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "brand", label: "Brand", icon: Palette },
  { id: "ai", label: "AI & content defaults", icon: Sparkles },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "posting", label: "Posting preferences", icon: Clock },
  { id: "channels", label: "Connected channels", icon: Plug },
];

const timezoneOptions = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Singapore",
  "Australia/Sydney",
];

/* ----------------------------- small helpers ------------------------------ */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-foreground">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Panel({
  title,
  description,
  children,
  saveLabel = "Save changes",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  saveLabel?: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <SectionHeader title={title} description={description} />
      </div>
      <div className="space-y-5 px-5 py-5 sm:px-6">{children}</div>
      <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5 sm:px-6">
        <Button variant="ghost" size="sm">
          Cancel
        </Button>
        <Button
          size="sm"
          className="bg-gradient-to-r from-brand-500 to-coral-500 text-white hover:opacity-90"
        >
          <Save className="h-3.5 w-3.5" /> {saveLabel}
        </Button>
      </div>
    </section>
  );
}

/* ------------------------------ notifications ----------------------------- */

const notificationPrefs: { id: string; label: string; desc: string; default: boolean }[] = [
  { id: "digests", label: "Email digests", desc: "A daily summary of activity across your workspace.", default: true },
  { id: "comments", label: "New comments", desc: "Get notified when someone comments on your posts.", default: true },
  { id: "published", label: "Scheduled post published", desc: "Confirmation when a queued post goes live.", default: true },
  { id: "trends", label: "Trend alerts", desc: "Spikes and emerging trends in your niche.", default: false },
  { id: "weekly", label: "Weekly report", desc: "Performance recap delivered every Monday.", default: true },
];

export default function SettingsPage() {
  const [active, setActive] = useState<SectionId>("profile");

  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(notificationPrefs.map((p) => [p.id, p.default]))
  );
  const [autoQueue, setAutoQueue] = useState(true);
  const [bestTime, setBestTime] = useState(true);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, workspace, brand and preferences."
        actions={
          <Button
            size="sm"
            className="bg-gradient-to-r from-brand-500 to-coral-500 text-white hover:opacity-90"
          >
            <Save className="h-4 w-4" /> Save changes
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left nav */}
        <nav className="lg:col-span-3">
          <div className="lg:sticky lg:top-6">
            <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
              {sections.map((s) => {
                const Icon = s.icon;
                const isActive = active === s.id;
                return (
                  <li key={s.id} className="shrink-0 lg:shrink">
                    <button
                      type="button"
                      onClick={() => setActive(s.id)}
                      className={`flex w-full items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-gradient-to-r from-brand-500/10 to-coral-500/10 text-brand-700"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? "text-brand-600" : ""}`} />
                      <span className="flex-1">{s.label}</span>
                      {isActive && <ChevronRight className="hidden h-4 w-4 text-brand-500 lg:block" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Right panels */}
        <div className="space-y-6 lg:col-span-9">
          {active === "profile" && (
            <Panel title="Profile" description="Your personal account details.">
              <div className="flex items-center gap-4">
                <Avatar initials="AR" size="lg" ring />
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Upload photo
                    </Button>
                    <Button variant="ghost" size="sm">
                      Remove
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name">
                  <Input defaultValue="Alex Rivera" />
                </Field>
                <Field label="Email address">
                  <Input type="email" defaultValue="alex@socialflow.ai" />
                </Field>
                <Field label="Role">
                  <SelectField
                    options={["Owner", "Admin", "Editor", "Viewer"]}
                    defaultValue="Owner"
                  />
                </Field>
                <Field label="Language">
                  <SelectField
                    options={["English (US)", "English (UK)", "Español", "Français"]}
                    defaultValue="English (US)"
                  />
                </Field>
              </div>
            </Panel>
          )}

          {active === "workspace" && (
            <Panel title="Workspace" description="Settings shared across your team.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Workspace name">
                  <Input defaultValue={settingsDefaults.brandName} />
                </Field>
                <Field label="Tagline">
                  <Input defaultValue={settingsDefaults.tagline} />
                </Field>
                <Field label="Timezone" hint="Used for scheduling and best-time suggestions.">
                  <SelectField options={timezoneOptions} defaultValue={settingsDefaults.timezone} />
                </Field>
                <Field label="Plan">
                  <SelectField options={["Starter", "Pro", "Agency"]} defaultValue="Pro" />
                </Field>
              </div>
            </Panel>
          )}

          {active === "brand" && (
            <Panel title="Brand" description="How your brand appears across generated content.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Brand name">
                  <Input defaultValue={settingsDefaults.brandName} />
                </Field>
                <Field label="Tagline">
                  <Input defaultValue={settingsDefaults.tagline} />
                </Field>
              </div>
              <Field label="Brand color" hint="Applied to exports, link previews and visual templates.">
                <div className="flex items-center gap-3">
                  <span className="h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br from-brand-500 to-coral-500 shadow-sm ring-1 ring-border" />
                  <Input defaultValue="#FF5A3C" className="max-w-[160px] font-mono" />
                  <span className="text-xs text-muted-foreground">
                    Placeholder — full theming arrives in a later phase.
                  </span>
                </div>
              </Field>
            </Panel>
          )}

          {active === "ai" && (
            <Panel
              title="AI & content defaults"
              description="Defaults applied when generating new content."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Default tone">
                  <SelectField options={studioToneOptions} defaultValue={settingsDefaults.defaultTone} />
                </Field>
                <Field label="AI provider" hint="Custom providers require an API key (configured later).">
                  <SelectField
                    options={["OpenAI (GPT)", "Claude", "Custom"]}
                    defaultValue={settingsDefaults.aiProvider}
                  />
                </Field>
              </div>
              <Field label="Default CTA">
                <Input defaultValue={settingsDefaults.defaultCTA} />
              </Field>
              <Field label="Default hashtags" hint="Appended to generated captions unless overridden.">
                <Textarea defaultValue={settingsDefaults.defaultHashtags} rows={3} />
              </Field>
            </Panel>
          )}

          {active === "webhooks" && (
            <Panel title="Webhooks" description="Send workspace events to an external endpoint.">
              <Field
                label="Webhook URL"
                hint="Placeholder — events POST as JSON. Signing secrets arrive in a later phase."
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input defaultValue={settingsDefaults.webhookUrl} className="font-mono" />
                  <Button variant="outline" size="sm" className="shrink-0">
                    <Send className="h-3.5 w-3.5" /> Test webhook
                  </Button>
                </div>
              </Field>
              <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                Delivers events such as{" "}
                <span className="font-medium text-foreground">post.published</span>,{" "}
                <span className="font-medium text-foreground">comment.received</span> and{" "}
                <span className="font-medium text-foreground">automation.run</span>.
              </div>
            </Panel>
          )}

          {active === "notifications" && (
            <Panel title="Notifications" description="Choose what we email and notify you about.">
              <ul className="divide-y divide-border">
                {notificationPrefs.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                    </div>
                    <Switch
                      checked={notifs[p.id]}
                      onCheckedChange={(v) => setNotifs((prev) => ({ ...prev, [p.id]: v }))}
                      aria-label={p.label}
                    />
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {active === "posting" && (
            <Panel title="Posting preferences" description="Control how posts are queued and scheduled.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Default schedule window" hint="New posts default into this window.">
                  <SelectField
                    options={[
                      "Morning · 8–10 AM",
                      "Midday · 11 AM–1 PM",
                      "Afternoon · 2–4 PM",
                      "Evening · 6–8 PM",
                    ]}
                    defaultValue="Morning · 8–10 AM"
                  />
                </Field>
                <Field label="Posts per day cap">
                  <SelectField options={["2", "3", "4", "5", "Unlimited"]} defaultValue="3" />
                </Field>
              </div>
              <div className="divide-y divide-border rounded-xl border border-border">
                <div className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Auto-queue new drafts</p>
                    <p className="text-xs text-muted-foreground">
                      Ready posts are added to the next open slot automatically.
                    </p>
                  </div>
                  <Switch
                    checked={autoQueue}
                    onCheckedChange={setAutoQueue}
                    aria-label="Auto-queue new drafts"
                  />
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Best-time suggestions</p>
                    <p className="text-xs text-muted-foreground">
                      Recommend optimal slots based on audience activity.
                    </p>
                  </div>
                  <Switch
                    checked={bestTime}
                    onCheckedChange={setBestTime}
                    aria-label="Best-time suggestions"
                  />
                </div>
              </div>
            </Panel>
          )}

          {active === "channels" && (
            <Panel
              title="Connected channels"
              description="Social accounts publishing through this workspace."
              saveLabel="Done"
            >
              <ul className="divide-y divide-border rounded-xl border border-border">
                {connectedChannels.map((c) => (
                  <li
                    key={`${c.platform}-${c.handle}`}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <PlatformBadge platform={c.platform as Platform} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{c.handle}</p>
                    </div>
                    <StatusBadge status={c.status} withDot />
                    {c.status === "error" ? (
                      <Button variant="destructive" size="sm">
                        Reconnect
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    )}
                  </li>
                ))}
                <li>
                  <Link
                    href="/integrations"
                    className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-brand-600 transition-colors hover:bg-muted/40"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-dashed border-brand-300 text-brand-500">
                      <Plus className="h-3.5 w-3.5" />
                    </span>
                    Connect channel
                  </Link>
                </li>
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
