import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  let colorClass = "bg-slate-100 text-slate-700 hover:bg-slate-200";
  
  if (status === "draft") colorClass = "bg-slate-100 text-slate-600 border-slate-200";
  if (status === "ready") colorClass = "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "scheduled") colorClass = "bg-orange-50 text-orange-700 border-orange-200";
  if (status === "posted" || status === "published" || status === "replied") colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "failed" || status === "ignored") colorClass = "bg-red-50 text-red-700 border-red-200";
  if (status === "new") colorClass = "bg-purple-50 text-purple-700 border-purple-200";

  return (
    <Badge variant="outline" className={`capitalize font-semibold tracking-wide text-[10px] uppercase ${colorClass}`}>
      {status}
    </Badge>
  );
}
