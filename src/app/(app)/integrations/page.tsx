import { Suspense } from "react";
import { getDbContext, isLive } from "@/lib/db/context";
import { listConnectedAccounts } from "@/lib/db/settings";
import { isLinkedInConfigured } from "@/lib/integrations/linkedin";
import { isMetaConfigured } from "@/lib/integrations/meta";
import { configuredScaffoldProviders } from "@/lib/integrations/scaffold";
import { IntegrationsView } from "./_view";

/**
 * Integrations (server) — overlays live connection state (when authenticated)
 * onto the integration catalog, and reports which providers have OAuth
 * configured. Demo/preview keeps the showcase statuses.
 */
export default async function IntegrationsPage() {
  const ctx = await getDbContext();
  const [accounts] = await Promise.all([listConnectedAccounts()]);

  const configuredProviders: string[] = [
    ...(isLinkedInConfigured() ? ["linkedin"] : []),
    ...(isMetaConfigured() ? ["facebook", "instagram"] : []),
    ...configuredScaffoldProviders(),
  ];

  return (
    <Suspense>
      <IntegrationsView
        live={isLive(ctx)}
        liveAccounts={accounts}
        configuredProviders={configuredProviders}
      />
    </Suspense>
  );
}
