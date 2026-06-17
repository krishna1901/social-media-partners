import { Suspense } from "react";
import { getDbContext, isLive } from "@/lib/db/context";
import { listConnectedAccounts } from "@/lib/db/settings";
import { isLinkedInConfigured } from "@/lib/integrations/linkedin";
import { IntegrationsView } from "./_view";

/**
 * Integrations (server) — overlays live connection state (when authenticated)
 * onto the integration catalog, and reports whether LinkedIn OAuth is
 * configured. Demo/preview keeps the showcase statuses.
 */
export default async function IntegrationsPage() {
  const ctx = await getDbContext();
  const [accounts] = await Promise.all([listConnectedAccounts()]);

  return (
    <Suspense>
      <IntegrationsView
        live={isLive(ctx)}
        liveAccounts={accounts}
        linkedinConfigured={isLinkedInConfigured()}
      />
    </Suspense>
  );
}
