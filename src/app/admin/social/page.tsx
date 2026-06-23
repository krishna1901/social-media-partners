import type { Metadata } from "next";
import { Share2 } from "lucide-react";
import { AdminConfigSection } from "@/components/admin/config-section";

export const metadata: Metadata = { title: "Social Apps" };

export default function AdminSocialPage() {
  return (
    <AdminConfigSection
      section="social"
      title="Social Apps"
      description="OAuth app credentials for each social network. Once configured, users can connect their own accounts from the front-panel Channels page."
      icon={<Share2 className="h-5 w-5" />}
    />
  );
}
