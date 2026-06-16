"use client";

import { PageTitle } from "@/components/ui/page-title";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, Users, Eye, MousePointerClick } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageTitle title="Analytics" description="Track the performance of your content and audience growth." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Views" 
          value="1.2M" 
          description="+12% from last month"
          icon={<div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center"><Eye className="h-4 w-4 text-blue-600" /></div>}
        />
        <StatCard 
          title="Engagement Rate" 
          value="4.8%" 
          description="+0.6% from last month"
          icon={<div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center"><MousePointerClick className="h-4 w-4 text-emerald-600" /></div>}
        />
        <StatCard 
          title="Followers Gained" 
          value="+4,230" 
          description="Consistent growth"
          icon={<div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center"><Users className="h-4 w-4 text-purple-600" /></div>}
        />
        <StatCard 
          title="Top Platform" 
          value="LinkedIn" 
          description="60% of total engagement"
          icon={<div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center"><BarChart2 className="h-4 w-4 text-orange-600" /></div>}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm min-h-[300px] flex items-center justify-center text-slate-500">
          Chart Placeholder (e.g. Recharts Line Chart)
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm min-h-[300px] flex items-center justify-center text-slate-500">
          Chart Placeholder (e.g. Recharts Bar Chart)
        </Card>
      </div>
    </div>
  );
}
