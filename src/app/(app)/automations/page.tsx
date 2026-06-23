import {
  listAutomations,
  listAutomationLogs,
  getAutomationStats,
} from "@/lib/db/automations";
import { getDbContext, isLive } from "@/lib/db/context";
import { AutomationsView } from "./_view";

export default async function AutomationsPage() {
  const [automations, logs, stats, ctx] = await Promise.all([
    listAutomations(),
    listAutomationLogs(),
    getAutomationStats(),
    getDbContext(),
  ]);
  return (
    <AutomationsView
      automations={automations}
      logs={logs}
      pendingApprovals={stats.pendingApprovals}
      pendingActions={stats.pendingActions}
      leadsCaptured={stats.leadsCaptured}
      demo={!isLive(ctx)}
    />
  );
}
