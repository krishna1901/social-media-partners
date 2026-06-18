import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  KeyRound,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const adminNav: AdminNavItem[] = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Workspaces", href: "/admin/workspaces", icon: Building2 },
  { title: "Billing", href: "/admin/billing", icon: CreditCard },
  { title: "Platform Keys", href: "/admin/secrets", icon: KeyRound },
  { title: "Audit Log", href: "/admin/audit", icon: ScrollText },
];
