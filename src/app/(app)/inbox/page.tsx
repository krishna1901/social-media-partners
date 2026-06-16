"use client";

import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Heart, Share2, Reply } from "lucide-react";

export default function InboxPage() {
  const messages = [
    { id: 1, author: "Sarah Jenkins", handle: "@sarahj", platform: "Twitter", content: "This is exactly what I was looking for! Any plans for an API?", time: "2h ago", unread: true },
    { id: 2, author: "Mike Ross", handle: "mike-ross", platform: "LinkedIn", content: "Great insights on the current market trends. Sharing this with my team.", time: "5h ago", unread: false },
  ];

  return (
    <div className="space-y-6">
      <PageTitle title="Unified Inbox" description="Respond to comments, mentions, and messages from all platforms." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-3">
          {messages.map((msg) => (
            <Card key={msg.id} className={`cursor-pointer transition-colors hover:bg-slate-50 ${msg.unread ? 'border-orange-200 bg-orange-50/30' : 'border-slate-200/60 bg-white/80'}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{msg.author}</p>
                    <p className="text-xs text-slate-500">{msg.handle} • {msg.platform}</p>
                  </div>
                  <span className="text-xs text-slate-400">{msg.time}</span>
                </div>
                <p className="text-sm text-slate-700 line-clamp-2">{msg.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="lg:col-span-2">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm min-h-[500px] flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p>Select a message to view and reply</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
