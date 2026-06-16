"use client";

import { useState, useEffect } from "react";
import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Plus, Search, Wand2, BookmarkPlus, Loader2, Trash2 } from "lucide-react";
import { getTrends, createTrend, deleteTrend } from "@/app/actions/trends";

export default function TrendsPage() {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    setLoading(true);
    const data = await getTrends();
    setTrends(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    await createTrend(formData);
    
    setIsSubmitting(false);
    setIsCreateOpen(false);
    fetchTrends();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to stop tracking this trend?")) {
      await deleteTrend(id);
      fetchTrends();
    }
  };

  const categories = ["all", ...Array.from(new Set(trends.map(t => t.category)))];

  const filteredTrends = trends.filter(trend => {
    const matchesSearch = trend.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || trend.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageTitle 
          title="Trend Radar" 
          description="Monitor what's hot in your niche to generate timely content." 
        />
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md shadow-orange-500/20 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Track New Trend
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Track New Trend</DialogTitle>
                <DialogDescription>
                  Manually add a trend or topic you want to monitor for content ideas.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Trend / Topic</Label>
                  <Input id="title" name="title" placeholder="e.g. AI Agents" required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" placeholder="e.g. Technology" required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Source (Optional)</Label>
                    <Input id="source" name="source" placeholder="e.g. Twitter, TikTok" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="relevance_score">Relevance (1-100)</Label>
                    <Input id="relevance_score" name="relevance_score" type="number" min="1" max="100" defaultValue="75" required />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Start Tracking
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search trends..." 
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-white">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(c => (
              <SelectItem key={c} value={c} className="capitalize">
                {c === 'all' ? 'All Categories' : c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : filteredTrends.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-orange-50 flex items-center justify-center mb-4 border border-orange-100">
              <TrendingUp className="h-8 w-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No trends found</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">
              {search || categoryFilter !== 'all' 
                ? "No trends match your search criteria." 
                : "Your trend radar is currently empty. Add topics to start tracking."}
            </p>
            {!(search || categoryFilter !== 'all') && (
              <Button onClick={() => setIsCreateOpen(true)} className="bg-orange-500 hover:bg-orange-600">
                <Plus className="mr-2 h-4 w-4" /> Add a trend
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTrends.map((trend) => (
            <Card key={trend.id} className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 group relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 hover:bg-red-50"
                onClick={() => handleDelete(trend.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              
              <CardHeader className="pb-2 pt-5">
                <div className="flex items-center justify-between mb-1 pr-6">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-500 bg-orange-50 px-2 py-0.5 rounded-sm">
                    {trend.category}
                  </span>
                  <span className="text-[10px] text-slate-400">{trend.source}</span>
                </div>
                <CardTitle className="text-base line-clamp-2 leading-tight pr-6">{trend.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-1.5 mt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Relevance</span>
                    <span className="font-semibold text-slate-700">{trend.relevance_score}/100</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        trend.relevance_score >= 80 ? 'bg-orange-500' : 
                        trend.relevance_score >= 50 ? 'bg-amber-400' : 'bg-slate-300'
                      }`}
                      style={{ width: `${trend.relevance_score}%` }}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t border-slate-100 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs h-8">
                  <BookmarkPlus className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                  Save Idea
                </Button>
                <Button variant="secondary" size="sm" className="flex-1 text-xs h-8 bg-orange-50 text-orange-600 hover:bg-orange-100 border-none">
                  <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                  Gen Hooks
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
