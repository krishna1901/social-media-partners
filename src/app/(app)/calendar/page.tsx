"use client";

import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const upcomingPosts = [
    { time: "10:00 AM", title: "Morning motivation tweet", platform: "Twitter", status: "scheduled" },
    { time: "2:30 PM", title: "Product update carousel", platform: "LinkedIn", status: "draft" },
  ];

  return (
    <div className="space-y-6">
      <PageTitle title="Content Calendar" description="Visualize and manage your publishing schedule." />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm md:col-span-2 min-h-[500px] flex items-center justify-center p-6 text-center">
          <div>
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border shadow-sm bg-white"
            />
          </div>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg text-slate-900 mb-4">
              Schedule for {date ? date.toLocaleDateString() : "Select a date"}
            </h3>
            
            <div className="space-y-4">
              {upcomingPosts.map((post, i) => (
                <div key={i} className="flex gap-4 p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <div className="text-sm font-medium text-slate-500 whitespace-nowrap">{post.time}</div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 leading-tight">{post.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-500">{post.platform}</span>
                      <StatusBadge status={post.status} />
                    </div>
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
