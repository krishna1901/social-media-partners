import { requireSuperAdmin } from "@/lib/admin/guard";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata = {
  title: { default: "Admin", template: "%s · SocialFlow Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireSuperAdmin();
  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
