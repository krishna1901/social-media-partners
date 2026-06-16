import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, value, description, icon, className }: StatCardProps) {
  return (
    <Card className={cn("bg-white/80 backdrop-blur-md border-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between space-y-0 pb-4">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          {icon && (
            <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 group-hover:bg-gradient-to-br group-hover:from-orange-500 group-hover:to-coral-500 group-hover:text-white transition-all duration-300 shadow-sm">
              {icon}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-3xl font-bold text-slate-900 tracking-tight">{value}</div>
          {description && (
            <p className="text-xs text-slate-500 font-medium">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
