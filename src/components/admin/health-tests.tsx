"use client";

import { useState, useTransition } from "react";
import {
  Database,
  HardDrive,
  Sparkles,
  CreditCard,
  Link2,
  Webhook,
  Clock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  type LucideIcon,
} from "lucide-react";
import {
  testDatabaseReadAction,
  testStorageAction,
  testAIProviderAction,
  testStripeAction,
  testOAuthRedirectsAction,
  testWebhookUrlAction,
  testCronSecretAction,
  type HealthTestResult,
} from "@/app/actions/health";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TestDef {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  run: () => Promise<HealthTestResult>;
}

const TESTS: TestDef[] = [
  { key: "db", label: "Supabase DB read", description: "Reads a row count from Postgres.", icon: Database, run: testDatabaseReadAction },
  { key: "storage", label: "Supabase Storage", description: "Lists buckets + writes/deletes a tiny temp file.", icon: HardDrive, run: testStorageAction },
  { key: "ai", label: "AI provider", description: "Confirms a provider key (no API call).", icon: Sparkles, run: testAIProviderAction },
  { key: "stripe", label: "Stripe", description: "Single free metadata read to validate the key.", icon: CreditCard, run: testStripeAction },
  { key: "oauth", label: "OAuth redirect URLs", description: "Computes the callback URLs to register.", icon: Link2, run: testOAuthRedirectsAction },
  { key: "webhook", label: "Webhook URL format", description: "Validates the webhook URL format.", icon: Webhook, run: testWebhookUrlAction },
  { key: "cron", label: "Cron secret", description: "Confirms the cron secret is set.", icon: Clock, run: testCronSecretAction },
];

const STATUS_META: Record<HealthTestResult["status"], { icon: LucideIcon; pill: string; icv: string }> = {
  pass: { icon: CheckCircle2, pill: "bg-emerald-50 text-emerald-700 ring-emerald-100", icv: "text-emerald-500" },
  warn: { icon: AlertTriangle, pill: "bg-amber-50 text-amber-700 ring-amber-100", icv: "text-amber-500" },
  fail: { icon: XCircle, pill: "bg-red-50 text-red-700 ring-red-100", icv: "text-red-500" },
};

function ResultPanel({ result }: { result: HealthTestResult }) {
  const m = STATUS_META[result.status];
  const Icon = m.icon;
  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4 shrink-0", m.icv)} />
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ring-1 ring-inset", m.pill)}>
          {result.status}
        </span>
        <p className="text-xs font-medium text-foreground">{result.message}</p>
      </div>
      {result.details && result.details.length > 0 && (
        <ul className="mt-2 space-y-1 break-words pl-6 text-[11px] text-muted-foreground">
          {result.details.map((d, i) => (
            <li key={i} className="font-mono">{d}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function HealthTests() {
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, HealthTestResult>>({});

  function runTest(def: TestDef) {
    setRunning(def.key);
    startTransition(async () => {
      try {
        const r = await def.run();
        setResults((prev) => ({ ...prev, [def.key]: r }));
      } catch (err) {
        setResults((prev) => ({
          ...prev,
          [def.key]: {
            ok: false,
            status: "fail",
            title: def.label,
            message: err instanceof Error ? err.message : "Test failed to run.",
          },
        }));
      } finally {
        setRunning(null);
      }
    });
  }

  function runAll() {
    startTransition(async () => {
      for (const def of TESTS) {
        setRunning(def.key);
        try {
          const r = await def.run();
          setResults((prev) => ({ ...prev, [def.key]: r }));
        } catch (err) {
          setResults((prev) => ({
            ...prev,
            [def.key]: { ok: false, status: "fail", title: def.label, message: err instanceof Error ? err.message : "Test failed." },
          }));
        }
      }
      setRunning(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Safe, read-mostly checks. No secrets are shown and no paid APIs are called.
        </p>
        <Button variant="outline" size="sm" disabled={pending} onClick={runAll}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          Run all
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {TESTS.map((def) => {
          const Icon = def.icon;
          const isRunning = running === def.key;
          const result = results[def.key];
          return (
            <div key={def.key} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{def.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{def.description}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled={pending} onClick={() => runTest(def)}>
                  {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Test"}
                </Button>
              </div>
              {result && <ResultPanel result={result} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
