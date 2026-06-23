import {
  LayoutDashboard,
  Users,
  Building2,
  Sparkles,
  Share2,
  CreditCard,
  Workflow,
  Webhook,
  KeyRound,
  ScrollText,
  Activity,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Operate",
    items: [
      { title: "Overview", href: "/admin", icon: LayoutDashboard },
      { title: "Users", href: "/admin/users", icon: Users },
      { title: "Workspaces", href: "/admin/workspaces", icon: Building2 },
    ],
  },
  {
    label: "Configure",
    items: [
      { title: "AI Providers", href: "/admin/ai", icon: Sparkles },
      { title: "Social Apps", href: "/admin/social", icon: Share2 },
      { title: "Payments", href: "/admin/payments", icon: CreditCard },
      { title: "Automation", href: "/admin/automation", icon: Workflow },
      { title: "Webhooks", href: "/admin/webhooks", icon: Webhook },
      { title: "All Keys", href: "/admin/secrets", icon: KeyRound },
    ],
  },
  {
    label: "Monitor",
    items: [
      { title: "Health", href: "/admin/health", icon: Activity },
      { title: "Audit Log", href: "/admin/audit", icon: ScrollText },
    ],
  },
];

/** Flat list (used for active-state matching and any legacy consumers). */
export const adminNav: AdminNavItem[] = adminNavGroups.flatMap((g) => g.items);
