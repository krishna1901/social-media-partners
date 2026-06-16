import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/ui/page-title";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Lightbulb, Send, Calendar, MessageSquare, Plus, PenSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [ideasResp, postsResp, scheduledResp, inboxResp] = await Promise.all([
    supabase.from("content_ideas").select("id", { count: "exact" }),
    supabase.from("posts").select("id").in("status", ["draft", "ready"]),
    supabase.from("posts").select("id").eq("status", "scheduled"),
    supabase.from("comments_inbox").select("id").eq("status", "new"),
  ]);

  const recentPosts = await supabase
    .from("posts")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageTitle 
          title={`Welcome back, ${user?.email?.split('@')[0] || 'Creator'}!`} 
          description="Here's what's happening with your content today." 
        />
        
        <div className="flex gap-2">
          <Link href="/studio">
            <Button variant="outline" className="bg-white">
              <Lightbulb className="mr-2 h-4 w-4 text-amber-500" /> AI Ideas
            </Button>
          </Link>
          <Link href="/posts/new">
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md shadow-orange-500/20">
              <Plus className="mr-2 h-4 w-4" /> New Post
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Content Ideas" 
          value={ideasResp.count || 0} 
          icon={<div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center"><Lightbulb className="h-4 w-4 text-amber-600" /></div>}
        />
        <StatCard 
          title="In Pipeline" 
          value={postsResp.data?.length || 0} 
          icon={<div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center"><PenSquare className="h-4 w-4 text-blue-600" /></div>}
        />
        <StatCard 
          title="Scheduled" 
          value={scheduledResp.data?.length || 0} 
          icon={<div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center"><Calendar className="h-4 w-4 text-emerald-600" /></div>}
        />
        <StatCard 
          title="New Comments" 
          value={inboxResp.data?.length || 0} 
          icon={<div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center"><MessageSquare className="h-4 w-4 text-purple-600" /></div>}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2 bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPosts.data?.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No recent activity. Start drafting some posts!
              </div>
            ) : (
              <div className="space-y-4">
                {recentPosts.data?.map(post => (
                  <div key={post.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-medium text-slate-900">{post.title}</p>
                      <p className="text-xs text-slate-500 capitalize">{post.post_type} • {post.topic}</p>
                    </div>
                    <StatusBadge status={post.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Database</span>
              <span className="text-emerald-400 font-medium">Connected</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">AI Engine</span>
              <span className="text-emerald-400 font-medium">Online</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Automations</span>
              <span className="text-slate-300 font-medium">0 Active</span>
            </div>
            <div className="pt-4 border-t border-slate-700">
              <Link href="/settings">
                <Button variant="outline" className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white hover:text-white">
                  Configure Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
