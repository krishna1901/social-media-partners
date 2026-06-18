"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Building2,
  Palette,
  Sparkles,
  Bell,
  Clock,
  Plug,
  Save,
  Plus,
  Settings as SettingsIcon,
  CheckCircle2,
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
import { PlatformIcon } from "@/components/ui/platform-icon";
import { studioToneOptions, platformMeta, type Platform } from "@/lib/demo-data";
import {
  updateSettings,
  upsertConnectedAccount,
  setConnectionStatus,
} from "@/app/actions/settings";
import type { getSettings, listConnectedAccounts } from "@/lib/db/settings";

type SettingsViewProps = {
  settings: Awaited<ReturnType<typeof getSettings>>;
  connectedAccounts: Awaited<ReturnType<typeof listConnectedAccounts>>;
};

type SectionId =
  | "profile"
  | "workspace"
  | "brand"
  | "ai"
  | "notifications"
  | "posting"
  | "channels";

type NavGroup = "Account" | "Content" | "Connections";

const sections: {
  id: SectionId;
  label: string;
  desc: string;
  icon: LucideIcon;
  group: NavGroup;
}[] = [
  { id: "profile", label: "Profile", desc: "Your account details", icon: User, group: "Account" },
  { id: "workspace", label: "Workspace", desc: "Team-wide settings", icon: Building2, group: "Account" },
  { id: "brand", label: "Brand", desc: "Identity & color", icon: Palette, group: "Account" },
  { id: "ai", label: "AI & content defaults", desc: "Generation defaults", icon: Sparkles, group: "Content" },
  { id: "posting", label: "Posting preferences", desc: "Queue & scheduling", icon: Clock, group: "Content" },
  { id: "notifications", label: "Notifications", desc: "Emails & alerts", icon: Bell, group: "Content" },
  { id: "channels", label: "Connected channels", desc: "Social accounts", icon: Plug, group: "Connections" },
];

const navGroups: NavGroup[] = ["Account", "Content", "Connections"];

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
  icon: Icon,
  children,
  saveLabel = "Save changes",
  onSave,
  saving = false,
  message,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  saveLabel?: string;
  onSave?: () => void;
  saving?: boolean;
  message?: { tone: "success" | "error"; text: string } | null;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <SectionHeader
          title={title}
          description={description}
          icon={Icon ? <Icon className="h-4 w-4" /> : undefined}
        />
      </div>
      <div className="space-y-5 px-5 py-5 sm:px-6">{children}</div>
      <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/20 px-5 py-3.5 sm:px-6">
        {message ? (
          <span
            className={`inline-flex items-center gap-1.5 text-xs ${
              message.tone === "error" ? "text-red-600" : "text-emerald-600"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> {message.text}
          </span>
        ) : (
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> All changes saved
          </span>
        )}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button size="sm" variant="gradient" onClick={onSave} disabled={saving}>
            <Save className="h-3.5 w-3.5" /> {saveLabel}
          </Button>
        </div>
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

export function SettingsView({ settings, connectedAccounts }: SettingsViewProps) {
  const router = useRouter();
  const [active, setActive] = useState<SectionId>("profile");

  const [notifs, setNotifs] = useState<Record<string, boolean>>({
    ...Object.fromEntries(notificationPrefs.map((p) => [p.id, p.default])),
    ...settings.notificationPrefs,
  });
  const [autoQueue, setAutoQueue] = useState(settings.postingPrefs.autoQueue);
  const [bestTime, setBestTime] = useState(settings.postingPrefs.bestTime);
  const [defaultWindow, setDefaultWindow] = useState(settings.postingPrefs.defaultWindow);
  const [postsPerDay, setPostsPerDay] = useState(
    settings.postingPrefs.postsPerDay === 0
      ? "Unlimited"
      : String(settings.postingPrefs.postsPerDay)
  );

  // Editable settings field values (seeded from server-provided defaults).
  const [brandName, setBrandName] = useState(settings.brandName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [defaultTone, setDefaultTone] = useState(settings.defaultTone);
  const [defaultCTA, setDefaultCTA] = useState(settings.defaultCTA);
  const [defaultHashtags, setDefaultHashtags] = useState(settings.defaultHashtags);

  const [saving, startSaving] = useTransition();
  const [panelMessage, setPanelMessage] = useState<
    { tone: "success" | "error"; text: string } | null
  >(null);

  const [channelPending, startChannelTransition] = useTransition();
  const [channelMessage, setChannelMessage] = useState<
    { tone: "success" | "error"; text: string } | null
  >(null);

  const saveSettings = () => {
    setPanelMessage(null);
    startSaving(async () => {
      const result = await updateSettings({
        brandName,
        tagline,
        timezone,
        defaultTone,
        defaultCTA,
        defaultHashtags,
      });
      if (!result.ok) {
        setPanelMessage({ tone: "error", text: result.error });
        return;
      }
      setPanelMessage({ tone: "success", text: "Changes saved" });
      router.refresh();
    });
  };

  const savePosting = () => {
    setPanelMessage(null);
    startSaving(async () => {
      const result = await updateSettings({
        postingPrefs: {
          defaultWindow,
          postsPerDay: postsPerDay === "Unlimited" ? 0 : Number(postsPerDay),
          autoQueue,
          bestTime,
        },
      });
      if (!result.ok) {
        setPanelMessage({ tone: "error", text: result.error });
        return;
      }
      setPanelMessage({ tone: "success", text: "Posting preferences saved" });
      router.refresh();
    });
  };

  const saveNotifications = () => {
    setPanelMessage(null);
    startSaving(async () => {
      const result = await updateSettings({ notificationPrefs: notifs });
      if (!result.ok) {
        setPanelMessage({ tone: "error", text: result.error });
        return;
      }
      setPanelMessage({ tone: "success", text: "Notification preferences saved" });
      router.refresh();
    });
  };

  const connectedCount = connectedAccounts.filter((c) => c.status === "connected").length;
  const errorCount = connectedAccounts.filter((c) => c.status === "error").length;

  const reconnectChannel = (id: string) => {
    setChannelMessage(null);
    startChannelTransition(async () => {
      const result = await setConnectionStatus(id, "connected");
      if (!result.ok) {
        setChannelMessage({ tone: "error", text: result.error });
        return;
      }
      setChannelMessage({ tone: "success", text: "Channel reconnected" });
      router.refresh();
    });
  };

  const connectChannel = (platform: string) => {
    setChannelMessage(null);
    startChannelTransition(async () => {
      const result = await upsertConnectedAccount(platform, { status: "connected" });
      if (!result.ok) {
        setChannelMessage({ tone: "error", text: result.error });
        return;
      }
      setChannelMessage({ tone: "success", text: "Channel connected" });
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        icon={<SettingsIcon className="h-5 w-5" />}
        title="Settings"
        description="Manage your profile, workspace, brand and preferences."
        actions={
          <>
            <Button variant="outline" size="sm">
              View changelog
            </Button>
            <Button size="sm" variant="gradient" onClick={saveSettings} disabled={saving}>
              <Save className="h-4 w-4" /> Save changes
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left nav */}
        <nav className="lg:col-span-3" aria-label="Settings sections">
          <div className="lg:sticky lg:top-6">
            {/* Mobile: horizontal pill scroller */}
            <ul className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {sections.map((s) => {
                const Icon = s.icon;
                const isActive = active === s.id;
                return (
                  <li key={s.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setActive(s.id)}
                      aria-current={isActive ? "true" : undefined}
                      className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-gradient-to-r from-brand-500/10 to-coral-500/10 text-brand-700 ring-1 ring-brand-200"
                          : "border border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? "text-brand-600" : ""}`} />
                      {s.label}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Desktop: grouped nav card */}
            <div className="hidden rounded-2xl border border-border bg-card p-2 shadow-sm lg:block">
              {navGroups.map((group) => (
                <div key={group} className="mb-1 last:mb-0">
                  <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {group}
                  </p>
                  <ul className="space-y-0.5">
                    {sections
                      .filter((s) => s.group === group)
                      .map((s) => {
                        const Icon = s.icon;
                        const isActive = active === s.id;
                        return (
                          <li key={s.id}>
                            <button
                              type="button"
                              onClick={() => setActive(s.id)}
                              aria-current={isActive ? "true" : undefined}
                              className={`group/nav relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors ${
                                isActive
                                  ? "bg-gradient-to-r from-brand-500/10 to-coral-500/10"
                                  : "hover:bg-muted/60"
                              }`}
                            >
                              {isActive && (
                                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-brand-500 to-coral-500" />
                              )}
                              <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                  isActive
                                    ? "bg-gradient-to-br from-brand-500 to-coral-500 text-white shadow-sm"
                                    : "bg-muted text-muted-foreground group-hover/nav:text-foreground"
                                }`}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span
                                  className={`block truncate text-sm font-medium ${
                                    isActive ? "text-brand-700" : "text-foreground"
                                  }`}
                                >
                                  {s.label}
                                </span>
                                <span className="block truncate text-[11px] text-muted-foreground">
                                  {s.id === "channels"
                                    ? `${connectedAccounts.length} accounts`
                                    : s.desc}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                </ul>
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* Right panels */}
        <div className="space-y-6 lg:col-span-9">
          {active === "profile" && (
            <Panel title="Profile" description="Your personal account details." icon={User}>
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
            <Panel
              title="Workspace"
              description="Settings shared across your team."
              icon={Building2}
              onSave={saveSettings}
              saving={saving}
              message={panelMessage}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Workspace name">
                  <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
                </Field>
                <Field label="Tagline">
                  <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
                </Field>
                <Field label="Timezone" hint="Used for scheduling and best-time suggestions.">
                  <SelectField
                    options={timezoneOptions}
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  />
                </Field>
                <Field label="Plan" hint="Your plan is managed by your subscription.">
                  <Link
                    href="/billing"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 text-sm font-medium text-brand-600 hover:bg-muted"
                  >
                    Manage in Billing →
                  </Link>
                </Field>
              </div>
            </Panel>
          )}

          {active === "brand" && (
            <Panel
              title="Brand"
              description="How your brand appears across generated content."
              icon={Palette}
              onSave={saveSettings}
              saving={saving}
              message={panelMessage}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Brand name">
                  <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
                </Field>
                <Field label="Tagline">
                  <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
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
              icon={Sparkles}
              onSave={saveSettings}
              saving={saving}
              message={panelMessage}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Default tone">
                  <SelectField
                    options={studioToneOptions}
                    value={defaultTone}
                    onChange={(e) => setDefaultTone(e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Default CTA">
                <Input value={defaultCTA} onChange={(e) => setDefaultCTA(e.target.value)} />
              </Field>
              <Field label="Default hashtags" hint="Appended to generated captions unless overridden.">
                <Textarea
                  value={defaultHashtags}
                  onChange={(e) => setDefaultHashtags(e.target.value)}
                  rows={3}
                />
              </Field>
            </Panel>
          )}

          {active === "notifications" && (
            <Panel
              title="Notifications"
              description="Choose what we email and notify you about."
              icon={Bell}
              onSave={saveNotifications}
              saving={saving}
              message={panelMessage}
            >
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
            <Panel
              title="Posting preferences"
              description="Control how posts are queued and scheduled."
              icon={Clock}
              onSave={savePosting}
              saving={saving}
              message={panelMessage}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Default schedule window" hint="New posts default into this window.">
                  <SelectField
                    options={[
                      "Morning · 8–10 AM",
                      "Midday · 11 AM–1 PM",
                      "Afternoon · 2–4 PM",
                      "Evening · 6–8 PM",
                    ]}
                    value={defaultWindow}
                    onChange={(e) => setDefaultWindow(e.target.value)}
                  />
                </Field>
                <Field label="Posts per day cap">
                  <SelectField
                    options={["2", "3", "4", "5", "Unlimited"]}
                    value={postsPerDay}
                    onChange={(e) => setPostsPerDay(e.target.value)}
                  />
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
              icon={Plug}
              saveLabel="Done"
              message={channelMessage}
            >
              <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-2.5 text-xs">
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{connectedAccounts.length}</span> channels ·{" "}
                  <span className="font-semibold text-emerald-600">
                    {connectedCount} healthy
                  </span>
                  {errorCount > 0 && (
                    <>
                      {" · "}
                      <span className="font-semibold text-red-600">
                        {errorCount} need attention
                      </span>
                    </>
                  )}
                </span>
              </div>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {connectedAccounts.map((c) => {
                  const meta = platformMeta[c.platform as Platform];
                  const isError = c.status === "error";
                  const isConnected = c.status === "connected";
                  const displayHandle = c.account_handle ?? c.account_name ?? c.platform;
                  return (
                    <li
                      key={c.id}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${meta.tint} ${meta.text}`}
                      >
                        <PlatformIcon platform={c.platform as Platform} className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{displayHandle}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {meta.label} ·{" "}
                          {isError ? "Reconnection required" : "Synced 8m ago"}
                        </p>
                      </div>
                      <StatusBadge status={c.status} withDot className="hidden sm:inline-flex" />
                      {isError ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => reconnectChannel(c.id)}
                          disabled={channelPending}
                        >
                          Reconnect
                        </Button>
                      ) : isConnected ? (
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => connectChannel(c.platform)}
                          disabled={channelPending}
                        >
                          Connect
                        </Button>
                      )}
                    </li>
                  );
                })}
                <li>
                  <Link
                    href="/integrations"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-brand-600 transition-colors hover:bg-muted/40"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-dashed border-brand-300 text-brand-500">
                      <Plus className="h-4 w-4" />
                    </span>
                    <span className="flex-1">
                      <span className="block">Connect a new channel</span>
                      <span className="block text-xs font-normal text-muted-foreground">
                        Add Instagram, LinkedIn, TikTok, X and more.
                      </span>
                    </span>
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
