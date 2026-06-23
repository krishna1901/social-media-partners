import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { SECRET_GROUPS, ALL_SECRET_KEYS } from "@/lib/platform/catalog";
import { getSecretStatuses } from "@/lib/platform/secrets";
import { isAdminConfigured } from "@/lib/supabase/admin";
import { isEncryptionConfigured } from "@/lib/security/crypto";
import { ChartCard } from "@/components/ui/chart-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SecretEditor } from "@/components/admin/secret-editor";

export const metadata: Metadata = { title: "Platform Keys" };

export default async function AdminSecretsPage() {
  if (!isAdminConfigured()) {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-5 w-5" />}
        title="Admin backend not configured"
        description="Set SUPABASE_SERVICE_ROLE_KEY to manage platform keys."
      />
    );
  }

  const statuses = await getSecretStatuses(ALL_SECRET_KEYS);
  const encReady = isEncryptionConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All platform keys</h1>
        <p className="text-sm text-muted-foreground">
          Every API key in one place — also organized into the AI, Social, Payments, Automation and Webhooks
          sections. End-users never enter keys; the platform provides them. Values are encrypted at rest and
          shown masked. A value set here overrides the environment variable.
        </p>
      </div>

      {!encReady && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Set <code className="font-mono">TOKEN_ENCRYPTION_KEY</code> to store secret values securely.
          Non-secret config (provider, model, price ids) can still be saved.
        </div>
      )}

      {SECRET_GROUPS.map((g) => (
        <ChartCard key={g.group} title={g.group} subtitle={g.description}>
          <div className="space-y-3">
            {g.items.map((item) => (
              <SecretEditor
                key={item.key}
                secretKey={item.key}
                label={item.label}
                isSecret={item.isSecret ?? true}
                hint={item.hint}
                status={statuses[item.key] ?? { setInDb: false, setInEnv: false }}
              />
            ))}
          </div>
        </ChartCard>
      ))}
    </div>
  );
}
