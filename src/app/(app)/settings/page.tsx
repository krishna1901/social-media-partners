import { getSettings, listConnectedAccounts } from "@/lib/db/settings";
import { SettingsView } from "./_view";

export default async function SettingsPage() {
  const [settings, connectedAccounts] = await Promise.all([
    getSettings(),
    listConnectedAccounts(),
  ]);
  return <SettingsView settings={settings} connectedAccounts={connectedAccounts} />;
}
