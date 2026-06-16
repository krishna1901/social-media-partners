import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/ui/page-title";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Send, Calendar, AlertCircle } from "lucide-react";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // Fetch posts count by status
  const { data: posts } = await supabase.from("posts").select("status");
  const totalPosts = posts?.length || 0;
  
  const statusCounts = {
    posted: 0,
    scheduled: 0,
    failed: 0,
    draft: 0,
    ready: 0
  };

  posts?.forEach(post => {
    if (post.status in statusCounts) {
      statusCounts[post.status as keyof typeof statusCounts]++;
    }
  });

  // Fetch platform distribution
  const { data: channels } = await supabase.from("post_channels").select("platform");
  
  const platformCounts: Record<string, number> = {};
  channels?.forEach(ch => {
    platformCounts[ch.platform] = (platformCounts[ch.platform] || 0) + 1;
  });

  // Calculate percentages for the UI
  const getPercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const totalChannels = channels?.length || 0;

  return (
    <div className="space-y-6">
      <PageTitle 
        title="Analytics Overview" 
        description="Track your content pipeline and platform distribution." 
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Posts" 
          value={totalPosts.toString()} 
          icon={<div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center"><BarChart className="h-4 w-4 text-white" /></div>}
        />
        <StatCard 
          title="Published" 
          value={statusCounts.posted.toString()} 
          icon={<div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center"><Send className="h-4 w-4 text-white" /></div>}
        />
        <StatCard 
          title="Scheduled" 
          value={statusCounts.scheduled.toString()} 
          icon={<div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center"><Calendar className="h-4 w-4 text-white" /></div>}
        />
        <StatCard 
          title="Failed" 
          value={statusCounts.failed.toString()} 
          icon={<div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center"><AlertCircle className="h-4 w-4 text-white" /></div>}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm">
          <CardHeader>
            <CardTitle>Posts by Status</CardTitle>
            <CardDescription>Breakdown of your current content pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {totalPosts === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No data available yet. Create some posts to see analytics.
              </div>
            ) : (
              [
                { label: "Published", count: statusCounts.posted, color: "bg-emerald-500" },
                { label: "Scheduled", count: statusCounts.scheduled, color: "bg-orange-500" },
                { label: "Ready", count: statusCounts.ready, color: "bg-blue-500" },
                { label: "Drafts", count: statusCounts.draft, color: "bg-slate-400" },
              ].map(status => (
                <div key={status.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{status.label}</span>
                    <span className="text-slate-500">{status.count} ({getPercentage(status.count, totalPosts)}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${status.color} rounded-full`}
                      style={{ width: `${getPercentage(status.count, totalPosts)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm">
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Where your content is being targeted</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {totalChannels === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No platform data available. Select platforms when creating posts.
              </div>
            ) : (
              Object.entries(platformCounts).sort(([,a], [,b]) => b - a).map(([platform, count]) => {
                let color = "bg-slate-500";
                if (platform === 'linkedin') color = "bg-sky-600";
                if (platform === 'x') color = "bg-slate-900";
                if (platform === 'instagram') color = "bg-pink-600";
                if (platform === 'youtube') color = "bg-red-600";
                if (platform === 'tiktok') color = "bg-black";
                
                return (
                  <div key={platform} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700 capitalize">{platform}</span>
                      <span className="text-slate-500">{count} ({getPercentage(count, totalChannels)}%)</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${color} rounded-full`}
                        style={{ width: `${getPercentage(count, totalChannels)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
