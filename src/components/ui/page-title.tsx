import { cn } from "@/lib/utils";

interface PageTitleProps {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageTitle({ title, description, className, children }: PageTitleProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      {description && <p className="text-sm text-slate-500">{description}</p>}
      {children}
    </div>
  );
}
