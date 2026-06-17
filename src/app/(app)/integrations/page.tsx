"use client";

import {
  RefreshCw,
  Sparkles,
  Workflow,
  Webhook,
  Plug,
  CheckCircle2,
  AlertTriangle,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { Button } from "@/components/ui/button";
import { integrations, type Platform } from "@/lib/demo-data";

type Integration = (typeof integrations)[number];

const PLATFORM_IDS: Platform[] = ["instagram", "facebook", "linkedin", "youtube", "tiktok", "x"];

const lucideById: Record<string, LucideIcon> = {
  openai: Sparkles,
  claude: Sparkles,
  n8n: Workflow,
  webhooks: Webhook,
};

const categories = ["Social", "AI", "Automation"] as const;

const categoryMeta: Record<(typeof categories)[number], { description: string }> = {
  Social: { description: "Publish and sync engagement across your social channels." },
  AI: { description: "Connect AI providers that power content generation." },
  Automation: { description: "Wire SocialFlow into your workflows and external tools." },
};

const setupNotes: Record<Integration["status"], string> = {
  connected: "Auto-syncs every 15 min",
  available: "Requires OAuth connection",
  error: "Token expired — reconnect",
};

function isPlatform(id: string): id is Platform {
  return (PLATFORM_IDS as string[]).includes(id);
}

function IntegrationTile({ item }: { item: Integration }) {
  const LucideIco = lucideById[item.id] ?? Plug;
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${item.accent}`}
    >
      {item.category === "Social" && isPlatform(item.id) ? (
        <PlatformIcon platform={item.id} className="h-5 w-5 text-white" />
      ) : (
        <LucideIco className="h-5 w-5" />
      )}
    </div>
  );
}

function IntegrationCard({ item }: { item: Integration }) {
  return (
    <div className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3">
        <IntegrationTile item={item} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{item.name}</h3>
            <StatusBadge status={item.status} withDot />
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
        </div>
      </div>

      <div className="mt-4 space-y-1.5 rounded-xl bg-muted/40 px-3 py-2.5">
        {item.lastSync && (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" /> Last sync · {item.lastSync}
          </p>
        )}
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {item.status === "error" ? (
            <AlertTriangle className="h-3 w-3 text-red-500" />
          ) : (
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          )}
          {setupNotes[item.status]}
        </p>
      </div>

      <div className="mt-4 flex items-center">
        {item.status === "connected" ? (
          <Button variant="outline" size="sm" className="w-full">
            Manage
          </Button>
        ) : item.status === "error" ? (
          <Button variant="destructive" size="sm" className="w-full">
            <RefreshCw className="h-3.5 w-3.5" /> Reconnect
          </Button>
        ) : (
          <Button
            size="sm"
            className={`w-full bg-gradient-to-r text-white hover:opacity-90 ${item.accent}`}
          >
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  const connected = integrations.filter((i) => i.status === "connected").length;
  const available = integrations.filter((i) => i.status === "available").length;
  const needsAttention = integrations.filter((i) => i.status === "error").length;
  const aiProviders = integrations.filter((i) => i.category === "AI").length;

  const stats = [
    {
      label: "Connected",
      value: connected,
      hint: "Active integrations",
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
      hint: "Action required",
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
        title="Integrations"
        description="Connect your social accounts, AI providers and automation tools."
        actions={
          <Button variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" /> Refresh status
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            hint={s.hint}
            icon={s.icon}
            accent={s.accent}
          />
        ))}
      </div>

      {categories.map((category) => {
        const items = integrations.filter((i) => i.category === category);
        if (items.length === 0) return null;
        return (
          <section key={category} className="space-y-4">
            <SectionHeader
              title={category}
              description={categoryMeta[category].description}
              action={
                <span className="text-xs font-medium text-muted-foreground">
                  {items.length} {items.length === 1 ? "integration" : "integrations"}
                </span>
              }
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <IntegrationCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
