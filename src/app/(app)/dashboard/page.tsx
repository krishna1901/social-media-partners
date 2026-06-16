import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/ui/page-title";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Lightbulb, Send, Calendar, MessageSquare, Plus, PenSquare, Image as ImageIcon, Edit2, Trash2, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [ideasResp, postsResp, scheduledResp] = await Promise.all([
    supabase.from("content_ideas").select("id", { count: "exact" }),
    supabase.from("posts").select("id"),
    supabase.from("posts").select("id").eq("status", "scheduled"),
  ]);

  const recentPosts = await supabase
    .from("posts")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(5);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Instagram': return (
        <svg className="h-4 w-4 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      );
      case 'Twitter': return (
        <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
        </svg>
      );
      case 'LinkedIn': return (
        <svg className="h-4 w-4 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
          <rect x="2" y="9" width="4" height="12"></rect>
          <circle cx="4" cy="4" r="2"></circle>
        </svg>
      );
      default: return (
        <svg className="h-4 w-4 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
          <rect x="2" y="9" width="4" height="12"></rect>
          <circle cx="4" cy="4" r="2"></circle>
        </svg>
      );
    }
  };

  const getDummyPlatform = (index: number) => {
    const platforms = ['Instagram', 'Twitter', 'LinkedIn'];
    return platforms[index % platforms.length];
  };

  const getDummyScore = (index: number) => [92, 88, 75, 81, 95][index % 5];

  const activityFeed = [
    { id: 1, user: "Sarah J.", action: "wrote a new draft", item: "Winter Collection Launch", time: "2m ago" },
    { id: 2, user: "Alex T.", action: "approved", item: "AI Tech Tips", time: "1h ago" },
    { id: 3, user: "Sarah J.", action: "scheduled", item: "Q4 Roadmap", time: "3h ago" },
    { id: 4, user: "Mike R.", action: "left a comment on", item: "Holiday Promo", time: "5h ago" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* We keep the PageTitle simple, but we don't really need it if we have no hero in the dashboard mockup. The mockup has no title on top of stats. Let's just remove it and let stats be top, or keep it. I'll keep it for context. */}
        <PageTitle 
          title={`Welcome back, ${user?.email?.split('@')[0] || 'Creator'}!`} 
          description="Here's what's happening with your content today." 
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Posts" 
          value={postsResp.data?.length || 4812} 
          trend={{ value: "+12%", isPositive: true }}
          icon={<div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-sm"><PenSquare className="h-5 w-5 text-white" /></div>}
        />
        <StatCard 
          title="Scheduled" 
          value={scheduledResp.data?.length || 185} 
          trend={{ value: "+5%", isPositive: true }}
          icon={<div className="h-10 w-10 rounded-xl bg-gradient-to-br from-coral-400 to-coral-500 flex items-center justify-center shadow-sm"><Calendar className="h-5 w-5 text-white" /></div>}
        />
        <StatCard 
          title="Engagement" 
          value="9.2%" 
          trend={{ value: "+0.8%", isPositive: true }}
          icon={<div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-400 flex items-center justify-center shadow-sm"><TrendingUp className="h-5 w-5 text-white" /></div>}
        />
        <StatCard 
          title="AI-Generated" 
          value="1,208" 
          trend={{ value: "+18%", isPositive: true }}
          icon={<div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm"><Bot className="h-5 w-5 text-white" /></div>}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="col-span-2 bg-white/80 backdrop-blur-md border-slate-200/60 shadow-lg shadow-slate-200/20 rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-white/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-xl font-bold text-slate-800">Recent Content Drafts</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm rounded-full px-4">
                <Plus className="mr-2 h-4 w-4" /> New Post
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-orange-400 to-coral-500 hover:from-orange-500 hover:to-coral-600 text-white shadow-md shadow-orange-500/20 border-0 rounded-full px-4">
                Approve All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentPosts.data?.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No recent activity. Start drafting some posts!
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-500 bg-slate-50/50 uppercase font-medium">
                    <tr>
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Platform</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">AI Score</th>
                      <th className="px-6 py-4">Created Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentPosts.data?.map((post, i) => {
                      const platform = getDummyPlatform(i);
                      return (
                        <tr key={post.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-6 py-4 font-medium text-slate-900">{post.title}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon(platform)}
                              <span className="font-medium text-slate-700">{platform}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={i === 1 ? 'review' : post.status} />
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900">{getDummyScore(i)}</td>
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(post.created_at || post.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                                <ImageIcon className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="col-span-1 bg-white/80 backdrop-blur-md border-slate-200/60 shadow-lg shadow-slate-200/20 rounded-2xl">
          <CardHeader className="bg-white/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-xl font-bold text-slate-800">Activity Feed</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {activityFeed.map((activity, i) => (
                <div key={activity.id} className="flex gap-4 relative">
                  {i !== activityFeed.length - 1 && (
                    <div className="absolute left-4 top-10 bottom-[-1.5rem] w-px bg-slate-200" />
                  )}
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0 flex items-center justify-center border border-white shadow-sm z-10">
                    <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-800 font-medium">
                      {activity.user} <span className="text-slate-500 font-normal">{activity.action}</span>
                    </p>
                    <p className="text-sm text-slate-900 font-medium mt-0.5">{activity.item}</p>
                    {i === 0 && (
                      <div className="mt-2 bg-slate-50 rounded-lg p-2 border border-slate-100 flex gap-2">
                        <div className="h-12 w-12 bg-slate-200 rounded border border-slate-300"></div>
                        <div className="h-12 w-12 bg-slate-200 rounded border border-slate-300"></div>
                      </div>
                    )}
                    {i === 1 && (
                      <div className="mt-2 bg-blue-50/50 rounded-lg p-3 border border-blue-100 text-xs text-blue-800">
                        "Great hook, let's publish this!"
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-2">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
