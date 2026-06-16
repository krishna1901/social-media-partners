"use client";

import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Plus, ArrowRight, Zap } from "lucide-react";

export default function AutomationsPage() {
  const rules = [
    { name: "Welcome DM", trigger: "New Follower", action: "Send DM Template 1", active: true },
    { name: "Comment Reply", trigger: "Comment contains 'link'", action: "Reply with link", active: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageTitle title="Automations" description="Set up rules to handle comments and DMs automatically." />
        <Button className="bg-slate-900 text-white hover:bg-slate-800">
          <Plus className="mr-2 h-4 w-4" /> New Rule
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rules.map((rule, i) => (
          <Card key={i} className={`bg-white/80 backdrop-blur-sm shadow-sm transition-all ${rule.active ? 'border-orange-200' : 'border-slate-200/60'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center justify-between">
                {rule.name}
                <div className={`h-2 w-2 rounded-full ${rule.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </CardTitle>
              <CardDescription>If: {rule.trigger}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-100">
                <Zap className="h-4 w-4 text-orange-500" />
                <ArrowRight className="h-4 w-4 text-slate-400 mx-1" />
                <span>{rule.action}</span>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm" className="text-xs">Edit Rule</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
