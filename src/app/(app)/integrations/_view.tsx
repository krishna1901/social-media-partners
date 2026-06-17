"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  RefreshCw,
  Sparkles,
  Workflow,
  Webhook,
  Plug,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  X as XIcon,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { integrations, type Platform } from "@/lib/demo-data";
import type { MappedConnectedAccount } from "@/lib/db/settings";
import { disconnectPlatformAction } from "@/app/actions/integrations";

type Integration = (typeof integrations)[number];
type Status = Integration["status"];

const PLATFORM_IDS: Platform[] = ["instagram", "facebook", "linkedin", "youtube", "tiktok", "x"];

const lucideById: Record<string, LucideIcon> = {
  openai: Sparkles,
  claude: Sparkles,
  n8n: Workflow,
  webhooks: Webhook,
};

const categories = ["Social", "AI", "Automation"] as const;
type Category = (typeof categories)[number];

const categoryMeta: Record<Category, { description: string }> = {
  Social: { description: "Publish and sync engagement across your social channels." },
  AI: { description: "Connect AI providers that power content generation." },
  Automation: { description: "Wire SocialFlow into your workflows and external tools." },
};

const setupNotes: Record<Status, string> = {
  connected: "Connected & ready to publish",
  available: "Requires OAuth connection",
  error: "Token expired — reconnect",
};

type StatusFilter = "all" | Status;

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "connected", label: "Connected" },
  { value: "available", label: "Available" },
  { value: "error", label: "Needs attention" },
];

const ERROR_MESSAGES: Record<string, string> = {
  linkedin_not_configured: "LinkedIn isn't configured on the server (missing app credentials).",
  encryption_not_configured: "Token encryption isn't configured on the server.",
  state_mismatch: "Security check failed — please try connecting again.",
  missing_code: "LinkedIn didn't return an authorization code. Please retry.",
  linkedin_connect_failed: "Couldn't complete the LinkedIn connection. Please try again.",
  meta_not_configured: "Meta isn't configured on the server (missing app credentials).",
  meta_connect_failed: "Couldn't complete the Meta connection. Please try again.",
  no_facebook_page: "No Facebook Page found on that account. Create/select a Page and retry.",
  user_cancelled_login: "Connection cancelled.",
};

function isPlatform(id: string): id is Platform {
  return (PLATFORM_IDS as string[]).includes(id);
}

/** OAuth start path for a platform (LinkedIn + Meta have dedicated routes). */
const OAUTH_HREF: Record<string, string> = {
  linkedin: "/api/oauth/linkedin/start",
  facebook: "/api/oauth/meta/start",
  instagram: "/api/oauth/meta/start",
  youtube: "/api/oauth/youtube/start",
  tiktok: "/api/oauth/tiktok/start",
  x: "/api/oauth/x/start",
};

/** OAuth start path + whether the provider is configured, for a platform. */
function oauthStartFor(
  platform: string,
  configuredProviders: string[]
): { href: string; configured: boolean } | null {
  const href = OAUTH_HREF[platform];
  if (!href) return null;
  return { href, configured: configuredProviders.includes(platform) };
}

function IntegrationTile({ item }: { item: Integration }) {
  const LucideIco = lucideById[item.id] ?? Plug;
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ring-1 ring-white/15 transition-transform duration-300 group-hover:scale-105 ${item.accent}`}
    >
      {item.category === "Social" && isPlatform(item.id) ? (
        <PlatformIcon platform={item.id} className="h-5 w-5 text-white" />
      ) : (
        <LucideIco className="h-5 w-5" />
      )}
    </div>
  );
}

function IntegrationCard({
  item,
  live,
  configuredProviders,
  onDisconnect,
  disconnecting,
}: {
  item: Integration;
  live: boolean;
  configuredProviders: string[];
  onDisconnect: (platform: string) => void;
  disconnecting: boolean;
}) {
  const oauth = oauthStartFor(item.id, configuredProviders);
  // Connectable in demo (showcase) or when the provider's OAuth is configured.
  const connectable = !live || Boolean(oauth?.configured);
  const supportsDisconnect = live && Boolean(oauth);

  return (
    <div className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated hover:ring-1 hover:ring-brand-200/70">
      <div className="flex items-start gap-3">
        <IntegrationTile item={item} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{item.name}</h3>
            <StatusBadge status={item.status} withDot />
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
        </div>
      </div>

      <div className="mt-4 space-y-1.5 rounded-xl bg-muted/40 px-3 py-2.5">
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          Last sync · <span className="font-medium text-foreground/80">{item.lastSync ?? "Never"}</span>
        </p>
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {item.status === "error" ? (
            <AlertTriangle className="h-3 w-3 shrink-0 text-red-500" />
          ) : (
            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
          )}
          {setupNotes[item.status]}
        </p>
      </div>

      <div className="mt-4 flex items-center">
        {item.status === "connected" ? (
          supportsDisconnect ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onDisconnect(item.id)}
              disabled={disconnecting}
            >
              <XIcon className="h-3.5 w-3.5" /> Disconnect
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="w-full">
              Manage
            </Button>
          )
        ) : item.status === "error" && oauth && connectable ? (
          <a
            href={oauth.href}
            className={cn(buttonVariants({ variant: "destructive", size: "sm" }), "w-full")}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reconnect
          </a>
        ) : oauth && connectable ? (
          <a
            href={oauth.href}
            className={cn(
              buttonVariants({ size: "sm" }),
              `w-full bg-gradient-to-r text-white hover:opacity-90 ${item.accent}`
            )}
          >
            <Plug className="h-3.5 w-3.5" /> Connect {item.name}
          </a>
        ) : live ? (
          <Button size="sm" variant="outline" className="w-full" disabled>
            Coming soon
          </Button>
        ) : (
          <Button size="sm" className={`w-full bg-gradient-to-r text-white hover:opacity-90 ${item.accent}`}>
            <Plug className="h-3.5 w-3.5" /> Connect
          </Button>
        )}
      </div>
    </div>
  );
}

export function IntegrationsView({
  live,
  liveAccounts,
  configuredProviders,
}: {
  live: boolean;
  liveAccounts: MappedConnectedAccount[];
  configuredProviders: string[];
}) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [dismissed, setDismissed] = useState(false);
  const [isDisconnecting, startDisconnect] = useTransition();
  const searchParams = useSearchParams();

  const connectedParam = searchParams.get("connected");
  const errorParam = searchParams.get("error");

  // Overlay live connection state onto social integrations when authenticated.
  const items: Integration[] = useMemo(() => {
    if (!live) return integrations;
    return integrations.map((i) => {
      if (i.category !== "Social") return i;
      const acct = liveAccounts.find((a) => a.platform === i.id);
      const liveStatus: Status = !acct
        ? "available"
        : acct.status === "connected"
          ? "connected"
          : acct.status === "error"
            ? "error"
            : "available";
      return {
        ...i,
        status: liveStatus,
        lastSync: acct?.last_sync_at
          ? new Date(acct.last_sync_at).toLocaleString()
          : liveStatus === "available"
            ? undefined
            : i.lastSync,
      };
    });
  }, [live, liveAccounts]);

  const connected = items.filter((i) => i.status === "connected").length;
  const available = items.filter((i) => i.status === "available").length;
  const needsAttention = items.filter((i) => i.status === "error").length;
  const aiProviders = items.filter((i) => i.category === "AI").length;

  const filtered = useMemo(
    () => (status === "all" ? items : items.filter((i) => i.status === status)),
    [status, items]
  );

  function handleDisconnect(platform: string) {
    startDisconnect(async () => {
      await disconnectPlatformAction(platform);
    });
  }

  const stats = [
    {
      label: "Connected",
      value: connected,
      delta: `${Math.round((connected / items.length) * 100)}%`,
      positive: true,
      hint: "Active & syncing",
      icon: <CheckCircle2 className="h-4 w-4" />,
      accent: "from-emerald-500 to-teal-500",
    },
    {
      label: "Available",
      value: available,
      hint: "Ready to connect",
      icon: <Plug className="h-4 w-4" />,
      accent: "from-brand-500 to-coral-500",
    },
    {
      label: "Needs attention",
      value: needsAttention,
      delta: needsAttention > 0 ? "Action" : undefined,
      positive: false,
      hint: "Reconnect required",
      icon: <AlertTriangle className="h-4 w-4" />,
      accent: "from-amber-500 to-orange-500",
    },
    {
      label: "AI providers",
      value: aiProviders,
      hint: "Generation engines",
      icon: <Sparkles className="h-4 w-4" />,
      accent: "from-violet-500 to-indigo-500",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Connections"
        title="Integrations"
        description="Connect your social accounts, AI providers and automation tools."
        icon={<Plug className="h-5 w-5" />}
        actions={
          <>
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex">
              <CheckCircle2 className="h-3.5 w-3.5" /> {connected} live
            </span>
            <Button variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" /> Refresh status
            </Button>
            <Button className="bg-gradient-to-r from-brand-500 to-coral-500 text-white shadow-sm shadow-brand-500/20 hover:opacity-95">
              <Plug className="h-4 w-4" /> Browse marketplace
            </Button>
          </>
        }
      />

      {!dismissed && connectedParam && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-medium capitalize">{connectedParam.replace(",", " & ")}</span> connected successfully.
          </span>
          <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}
      {!dismissed && errorParam && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            {ERROR_MESSAGES[errorParam] ?? "Something went wrong connecting that account."}
          </span>
          <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            delta={s.delta}
            positive={s.positive}
            hint={s.hint}
            icon={s.icon}
            accent={s.accent}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <p className="px-1 text-xs font-medium text-muted-foreground">
          Showing{" "}
          <span className="font-semibold text-foreground tabular-nums">{filtered.length}</span> of{" "}
          {items.length} integrations
        </p>
        <Segmented
          options={statusFilters}
          value={status}
          onValueChange={(v) => setStatus(v as StatusFilter)}
          size="sm"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="No integrations match this filter"
          description="Nothing here right now. Switch back to all integrations to browse everything you can connect."
          action={
            <Button variant="outline" size="sm" onClick={() => setStatus("all")}>
              <RefreshCw className="h-4 w-4" /> Show all integrations
            </Button>
          }
        />
      ) : (
        categories.map((category) => {
          const list = filtered.filter((i) => i.category === category);
          if (list.length === 0) return null;
          return (
            <section key={category} className="space-y-4">
              <SectionHeader
                title={category}
                description={categoryMeta[category].description}
                action={
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {list.length} {list.length === 1 ? "integration" : "integrations"}
                  </span>
                }
              />
              <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
                {list.map((item) => (
                  <IntegrationCard
                    key={item.id}
                    item={item}
                    live={live}
                    configuredProviders={configuredProviders}
                    onDisconnect={handleDisconnect}
                    disconnecting={isDisconnecting}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
