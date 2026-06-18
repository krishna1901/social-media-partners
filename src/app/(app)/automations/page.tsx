import { listAutomations, getAutomationStats } from "@/lib/db/automations";
import { getDbContext, isLive } from "@/lib/db/context";
import { AutomationsView } from "./_view";

export default async function AutomationsPage() {
  const [automations, stats, ctx] = await Promise.all([
    listAutomations(),
    getAutomationStats(),
    getDbContext(),
  ]);
  return (
    <AutomationsView
      automations={automations}
      pendingApprovals={stats.pendingApprovals}
      leadsCaptured={stats.leadsCaptured}
      demo={!isLive(ctx)}
    />
  );
}
