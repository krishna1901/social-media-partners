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
    <Card className={cn("bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {icon}
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-3xl font-bold text-slate-900">{value}</div>
          {description && (
            <p className="text-xs text-slate-500">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
