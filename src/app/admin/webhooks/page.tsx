import type { Metadata } from "next";
import { Webhook } from "lucide-react";
import { AdminConfigSection } from "@/components/admin/config-section";

export const metadata: Metadata = { title: "Webhooks" };

export default function AdminWebhooksPage() {
  return (
    <AdminConfigSection
      section="webhooks"
      title="Webhooks"
      description="Send platform events (e.g. post.published) to an external endpoint, with optional HMAC signing for verification."
      icon={<Webhook className="h-5 w-5" />}
    />
  );
}
