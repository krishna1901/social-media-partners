import Link from "next/link";
import { Plus, Sparkles, Lightbulb, UploadCloud, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const defaultActions: QuickAction[] = [
  { title: "New Post", href: "/posts/new", icon: Plus, color: "from-brand-500 to-coral-500" },
  { title: "Generate", href: "/content-studio", icon: Sparkles, color: "from-violet-500 to-indigo-500" },
  { title: "New Idea", href: "/ideas", icon: Lightbulb, color: "from-amber-400 to-orange-500" },
  { title: "Upload Media", href: "/media", icon: UploadCloud, color: "from-emerald-500 to-teal-500" },
  { title: "View Calendar", href: "/calendar", icon: CalendarDays, color: "from-sky-500 to-blue-500" },
];

export function QuickActions({ actions = defaultActions, className }: { actions?: QuickAction[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", className)}>
      {actions.map((a) => (
        <Link
          key={a.title}
          href={a.href}
          className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
        >
          <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform group-hover:scale-105", a.color)}>
            <a.icon className="h-5 w-5" />
          </span>
          <span className="text-xs font-semibold text-foreground">{a.title}</span>
        </Link>
      ))}
    </div>
  );
}
