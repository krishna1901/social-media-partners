"use client";

import { useState, useEffect } from "react";
import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, Check, Loader2, Sparkles, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function InboxPage() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments_inbox")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setComments(data);
    }
    setLoading(false);
  };

  const handleMarkReplied = async (id: string, text: string) => {
    setIsSubmitting(true);
    const supabase = createClient();
    await supabase
      .from("comments_inbox")
      .update({ status: "replied" })
      .eq("id", id);
    
    // In a real app, this would also send the reply via API
    await new Promise(r => setTimeout(r, 600)); // Simulate API call
    
    await fetchComments();
    setReplyingTo(null);
    setReplyText("");
    setIsSubmitting(false);
  };

  const handleIgnore = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from("comments_inbox")
      .update({ status: "ignored" })
      .eq("id", id);
    fetchComments();
  };

  const filteredComments = comments.filter(comment => {
    if (filter === "all") return true;
    return comment.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageTitle 
          title="Unified Inbox" 
          description="Manage comments and DMs across all your connected platforms." 
        />
        
        <Tabs defaultValue="all" onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All Messages</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="replied">Replied</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : filteredComments.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
              <MessageSquare className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Inbox Zero! 🎉</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              {filter === 'new' 
                ? "You've replied to all your new comments. Great job!" 
                : "No messages to display. Engage with your audience to get comments."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 max-w-3xl">
          {filteredComments.map((comment) => (
            <Card key={comment.id} className={`transition-all duration-200 bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm ${comment.status === 'replied' ? 'opacity-70' : ''}`}>
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase">
                    {comment.author.substring(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{comment.author}</span>
                      <Badge variant="secondary" className="capitalize text-[10px] bg-slate-100">{comment.platform}</Badge>
                    </div>
                    <span className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <StatusBadge status={comment.status} />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="bg-slate-50 p-4 rounded-xl text-slate-800 text-sm border border-slate-100">
                  "{comment.comment_text}"
                </div>

                {comment.status === 'new' && (
                  <div className="mt-4">
                    {replyingTo === comment.id ? (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Textarea 
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your reply..."
                          className="min-h-[100px] bg-white focus-visible:ring-orange-500"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            disabled={!replyText.trim() || isSubmitting}
                            onClick={() => handleMarkReplied(comment.id, replyText)}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                            Send Reply
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {comment.ai_suggested_reply && (
                          <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                            <div className="flex items-center gap-1.5 text-orange-600 text-xs font-semibold mb-1">
                              <Sparkles className="h-3.5 w-3.5" />
                              AI SUGGESTED REPLY
                            </div>
                            <p className="text-sm text-slate-700">{comment.ai_suggested_reply}</p>
                            <Button 
                              variant="link" 
                              className="text-orange-600 h-auto p-0 text-xs font-medium mt-1"
                              onClick={() => {
                                setReplyText(comment.ai_suggested_reply);
                                setReplyingTo(comment.id);
                              }}
                            >
                              Use this reply
                            </Button>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50"
                            onClick={() => {
                              setReplyText("");
                              setReplyingTo(comment.id);
                            }}
                          >
                            Write Reply
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleIgnore(comment.id)}
                          >
                            Ignore
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
