import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { AdminConfigSection } from "@/components/admin/config-section";

export const metadata: Metadata = { title: "AI Providers" };

export default function AdminAiPage() {
  return (
    <AdminConfigSection
      section="ai"
      title="AI Providers"
      description="API keys and model defaults that power the Content Studio and every AI feature. End-users never enter these — the platform provides them for all workspaces."
      icon={<Sparkles className="h-5 w-5" />}
    />
  );
}
