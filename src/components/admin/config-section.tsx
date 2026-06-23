import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { groupsForSection, sectionKeys, type SecretSection } from "@/lib/platform/catalog";
import { getSecretStatuses } from "@/lib/platform/secrets";
import { isAdminConfigured } from "@/lib/supabase/admin";
import { isEncryptionConfigured } from "@/lib/security/crypto";
import { ChartCard } from "@/components/ui/chart-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SecretEditor } from "@/components/admin/secret-editor";
import { FadeIn } from "@/components/motion/fade-in";

/**
 * Renders every catalog group for one admin section as premium secret-editor
 * cards. Reused by /admin/{ai,social,payments,automation,webhooks}.
 * Never exposes secret VALUES — `getSecretStatuses` returns booleans only.
 */
export async function AdminConfigSection({
  section,
  title,
  description,
  icon,
  intro,
}: {
  section: SecretSection;
  title: string;
  description: string;
  icon: ReactNode;
  intro?: ReactNode;
}) {
  if (!isAdminConfigured()) {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-5 w-5" />}
        title="Admin backend not configured"
        description="Set SUPABASE_SERVICE_ROLE_KEY to manage platform configuration."
      />
    );
  }

  const groups = groupsForSection(section);
  const statuses = await getSecretStatuses(sectionKeys(section));
  const encReady = isEncryptionConfigured();
  const hasSecretFields = groups.some((g) => g.items.some((i) => i.isSecret ?? true));

  return (
    <div className="space-y-6">
      <FadeIn className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl icon-gradient ring-1 ring-white/15">
          {icon}
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
      </FadeIn>

      {intro}

      {!encReady && hasSecretFields && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          Set <code className="font-mono">TOKEN_ENCRYPTION_KEY</code> to store secret values securely.
          Non-secret config (provider, model, price ids, URLs) can still be saved.
        </div>
      )}

      {groups.map((g) => (
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
