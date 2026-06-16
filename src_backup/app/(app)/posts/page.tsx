"use client";

import { useState, useEffect } from "react";
import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Send, Trash2, Edit2, Loader2, BarChart2 } from "lucide-react";
import { getPosts, deletePost } from "@/app/actions/posts";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const data = await getPosts();
    setPosts(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      await deletePost(id);
      fetchPosts();
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageTitle 
          title="Post Manager" 
          description="Manage, schedule, and analyze your content across all platforms." 
        />
        
        <Link href="/posts/new">
          <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md shadow-orange-500/20 w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <Tabs defaultValue="all" className="w-full sm:w-auto" onValueChange={setStatusFilter}>
              <TabsList className="w-full sm:w-auto grid grid-cols-5 sm:flex sm:flex-wrap">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
                <TabsTrigger value="ready">Ready</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="posted">Published</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search posts..." 
                className="pl-9 bg-slate-50 border-slate-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                <Send className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No posts found</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-6">
                {search || statusFilter !== 'all' 
                  ? "No posts match your filters. Try adjusting them." 
                  : "You haven't created any posts yet. Let's change that!"}
              </p>
              {!(search || statusFilter !== 'all') && (
                <Link href="/posts/new">
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" /> Create your first post
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[40%]">Post Details</TableHead>
                  <TableHead>Platforms</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id} className="group hover:bg-slate-50/50">
                    <TableCell>
                      <div className="font-medium text-slate-900 mb-1">{post.title}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="capitalize">{post.post_type}</span>
                        <span>•</span>
                        <span>{post.topic || 'General'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {post.post_channels && post.post_channels.length > 0 ? (
                          post.post_channels.map((ch: any) => (
                            <Badge key={ch.id} variant="secondary" className="capitalize text-[10px] bg-slate-100 text-slate-600">
                              {ch.platform}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">None selected</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={post.status} />
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDistanceToNow(new Date(post.updated_at || post.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild className="text-slate-600 cursor-pointer">
                            <Link href={`/posts/edit/${post.id}`}>
                              <Edit2 className="mr-2 h-4 w-4" /> Edit post
                            </Link>
                          </DropdownMenuItem>
                          {post.status === 'posted' && (
                            <DropdownMenuItem className="text-slate-600 cursor-pointer">
                              <BarChart2 className="mr-2 h-4 w-4" /> View analytics
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
