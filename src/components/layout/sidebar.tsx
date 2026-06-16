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

const NavGroup = ({ items, title, pathname }: { items: typeof mainNavItems, title?: string, pathname: string }) => (
  <div className="space-y-1 mt-6 first:mt-0">
    {title && <h4 className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{title}</h4>}
    {items.map((item) => {
      const isActive = pathname.startsWith(item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
            isActive 
              ? "bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-orange-500 border border-orange-500/20" 
              : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-100 border border-transparent"
          )}
        >
          <item.icon className={cn("h-4 w-4", isActive ? "text-orange-500" : "text-slate-500 group-hover:text-slate-300")} />
          {item.title}
        </Link>
      );
    })}
  </div>
);

export function Sidebar() {
  const pathname = usePathname();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r border-slate-800/60 bg-slate-950 shadow-xl z-20 relative">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-coral-600 flex items-center justify-center shadow-lg shadow-orange-500/20 transition-transform group-hover:scale-105">
            <span className="text-white font-bold text-xl leading-none">C</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Command</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-hide">
        <NavGroup items={mainNavItems} title="Create" pathname={pathname} />
        <NavGroup items={analyticNavItems} title="Listen & Grow" pathname={pathname} />
      </div>

      <div className="p-4 border-t border-slate-800/60">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors w-full border border-transparent",
            pathname === "/settings" 
              ? "bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-orange-500 border-orange-500/20" 
              : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-100"
          )}
        >
          <Settings className="h-4 w-4 text-slate-500" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors w-full text-slate-400 hover:bg-red-500/10 hover:text-red-400 mt-1 border border-transparent hover:border-red-500/20"
        >
          <LogOut className="h-4 w-4 text-slate-500" />
          Log out
        </button>
      </div>
    </div>
  );
}
