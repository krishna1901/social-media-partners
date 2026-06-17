import { listAutomations } from "@/lib/db/automations";
import { AutomationsView } from "./_view";

export default async function AutomationsPage() {
  const automations = await listAutomations();
  return <AutomationsView automations={automations} />;
}
