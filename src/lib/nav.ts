import {
  LayoutDashboard,
  Wand2,
  Lightbulb,
  PenSquare,
  TrendingUp,
  ImageIcon,
  CalendarDays,
  BarChart2,
  Inbox,
  Crosshair,
  Bot,
  Plug,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Create",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Content Studio", href: "/content-studio", icon: Wand2 },
      { title: "Idea Backlog", href: "/ideas", icon: Lightbulb },
      { title: "Post Manager", href: "/posts", icon: PenSquare },
      { title: "Trend Radar", href: "/trends", icon: TrendingUp },
      { title: "Media Library", href: "/media", icon: ImageIcon },
      { title: "Calendar", href: "/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Listen & Grow",
    items: [
      { title: "Analytics", href: "/analytics", icon: BarChart2 },
      { title: "Unified Inbox", href: "/inbox", icon: Inbox, badge: "23" },
      { title: "Competitors", href: "/competitors", icon: Crosshair },
      { title: "Automations", href: "/automations", icon: Bot },
    ],
  },
  {
    label: "Configure",
    items: [
      { title: "Integrations", href: "/integrations", icon: Plug },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);
