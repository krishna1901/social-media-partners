"use client";

import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Search, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function PostsPage() {
  const posts = [
    { id: 1, title: "10 Tips for Better UX", platform: "Twitter", status: "scheduled", date: "Oct 24, 2026" },
    { id: 2, title: "Product Launch Announcement", platform: "LinkedIn", status: "draft", date: "Oct 26, 2026" },
    { id: 3, title: "Behind the Scenes", platform: "Instagram", status: "published", date: "Oct 20, 2026" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageTitle title="Post Manager" description="Draft, schedule, and review your content across platforms." />
        <Button className="bg-slate-900 text-white hover:bg-slate-800">
          <Plus className="mr-2 h-4 w-4" /> Create Post
        </Button>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search posts..." className="pl-9 bg-slate-50 border-slate-200" />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Publish Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>{post.platform}</TableCell>
                  <TableCell><StatusBadge status={post.status} /></TableCell>
                  <TableCell className="text-slate-500">{post.date}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-900">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
