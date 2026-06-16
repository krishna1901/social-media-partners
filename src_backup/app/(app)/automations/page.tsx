"use client";

import { useState, useEffect } from "react";
import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { Plus, Bot, Trash2, Power, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AutomationsPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("dm_automations")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRules(data);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const supabase = createClient();
    
    await supabase.from("dm_automations").insert({
      keyword_trigger: formData.get("keyword_trigger"),
      platform: formData.get("platform"),
      auto_reply_message: formData.get("auto_reply_message"),
      status: "active",
      manual_approval_toggle: true, // Default to true for safety
    });
    
    setIsSubmitting(false);
    setIsCreateOpen(false);
    fetchRules();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this automation rule?")) {
      const supabase = createClient();
      await supabase.from("dm_automations").delete().eq("id", id);
      fetchRules();
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const supabase = createClient();
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    await supabase.from("dm_automations").update({ status: newStatus }).eq("id", id);
    fetchRules();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageTitle 
          title="DM Automations" 
          description="Set up keyword triggers to automatically send resources." 
        />
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md shadow-orange-500/20 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Automation Rule</DialogTitle>
                <DialogDescription>
                  Automatically reply to DMs that contain specific keywords.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyword_trigger">Keyword Trigger</Label>
                    <Input id="keyword_trigger" name="keyword_trigger" placeholder="e.g. GUIDE" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select name="platform" defaultValue="instagram">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="x">X (Twitter)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auto_reply_message">Auto Reply Message</Label>
                  <Textarea 
                    id="auto_reply_message" 
                    name="auto_reply_message" 
                    placeholder="Hey! Here's the link to the guide..." 
                    className="h-24"
                    required 
                  />
                  <p className="text-[10px] text-slate-500">
                    Include the link to your resource. All automations require manual approval before sending by default.
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Rule
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex gap-3">
          <Bot className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900">Automation Engine Details</h4>
            <p className="text-sm text-blue-700 mt-1">
              For safety, all triggered replies currently appear in your Unified Inbox for one-click manual approval before being sent out. Fully automated sending is coming in Phase 3.
            </p>
          </div>
        </div>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                <Bot className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No automations setup</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-6">
                Save time by automatically replying to common keyword requests.
              </p>
              <Button onClick={() => setIsCreateOpen(true)} variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Create your first rule
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Trigger</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead className="w-[40%]">Reply Preview</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id} className="group hover:bg-slate-50/50">
                    <TableCell className="font-medium text-slate-900">
                      "{rule.keyword_trigger}"
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize text-[10px] bg-slate-100">
                        {rule.platform}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-600 line-clamp-1">{rule.auto_reply_message}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={rule.status === 'active' ? 'default' : 'secondary'}
                        className={`text-[10px] uppercase font-bold tracking-wider ${
                          rule.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {rule.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={`h-8 w-8 ${rule.status === 'active' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400'}`}
                          onClick={() => toggleStatus(rule.id, rule.status)}
                          title="Toggle Status"
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
