"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Wand2, 
  Lightbulb, 
  PenSquare, 
  TrendingUp, 
  Image as ImageIcon, 
  Calendar, 
  BarChart2, 
  Inbox, 
  Crosshair, 
  Bot, 
  Settings,
  LogOut
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const mainNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Content Studio", href: "/studio", icon: Wand2 },
  { title: "Idea Backlog", href: "/ideas", icon: Lightbulb },
  { title: "Post Manager", href: "/posts", icon: PenSquare },
  { title: "Trend Radar", href: "/trends", icon: TrendingUp },
  { title: "Media Library", href: "/media", icon: ImageIcon },
  { title: "Calendar", href: "/calendar", icon: Calendar },
];

const analyticNavItems = [
  { title: "Analytics", href: "/analytics", icon: BarChart2 },
  { title: "Unified Inbox", href: "/inbox", icon: Inbox },
  { title: "Competitors", href: "/competitors", icon: Crosshair },
  { title: "Automations", href: "/automations", icon: Bot },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const NavGroup = ({ items, title }: { items: typeof mainNavItems, title?: string }) => (
    <div className="space-y-1 mt-6 first:mt-0">
      {title && <h4 className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{title}</h4>}
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
              isActive 
                ? "bg-orange-50 text-orange-600" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className={cn("h-4 w-4", isActive ? "text-orange-500" : "text-slate-400")} />
            {item.title}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-coral-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl leading-none">C</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">Command</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-hide">
        <NavGroup items={mainNavItems} title="Create" />
        <NavGroup items={analyticNavItems} title="Listen & Grow" />
      </div>

      <div className="p-4 border-t border-slate-100">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors w-full",
            pathname === "/settings" 
              ? "bg-orange-50 text-orange-600" 
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Settings className="h-4 w-4 text-slate-400" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors w-full text-slate-600 hover:bg-red-50 hover:text-red-600 mt-1"
        >
          <LogOut className="h-4 w-4 text-slate-400" />
          Log out
        </button>
      </div>
    </div>
  );
}
