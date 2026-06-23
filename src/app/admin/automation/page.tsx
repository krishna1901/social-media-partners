import type { Metadata } from "next";
import { Workflow } from "lucide-react";
import { AdminConfigSection } from "@/components/admin/config-section";

export const metadata: Metadata = { title: "Automation & Workflows" };

export default function AdminAutomationPage() {
  return (
    <AdminConfigSection
      section="automation"
      title="Automation & Workflows"
      description="Connect an n8n instance for external workflow automation and protect the scheduled cron jobs that publish posts, sync analytics and run auto-reply automations."
      icon={<Workflow className="h-5 w-5" />}
    />
  );
}
