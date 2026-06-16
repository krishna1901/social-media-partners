"use client";

import { useState, useEffect } from "react";
import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { createClient } from "@/lib/supabase/client";
import { format, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  const fetchScheduledPosts = async () => {
    const supabase = createClient();
    // Fetch posts that have a scheduled status
    const { data, error } = await supabase
      .from("scheduled_posts")
      .select("*, posts(*, post_channels(*))")
      .order("scheduled_at", { ascending: true });

    if (!error && data) {
      setScheduledPosts(data);
    }
    setLoading(false);
  };

  const selectedDatePosts = scheduledPosts.filter((schedule) => 
    date && schedule.scheduled_at && isSameDay(new Date(schedule.scheduled_at), date)
  );

  return (
    <div className="space-y-6">
      <PageTitle 
        title="Content Calendar" 
        description="Schedule and visualize your content pipeline." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm">
            <CardContent className="p-4 flex justify-center">
              <CalendarPicker
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
                modifiers={{
                  hasPost: scheduledPosts.map(p => new Date(p.scheduled_at))
                }}
                modifiersStyles={{
                  hasPost: { fontWeight: 'bold', border: '2px solid #f97316' }
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-orange-500" />
                {date ? format(date, "EEEE, MMMM do, yyyy") : "Select a date"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                </div>
              ) : selectedDatePosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                    <CalendarIcon className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">No posts scheduled</h3>
                  <p className="text-slate-500 text-sm max-w-sm">
                    There is no content scheduled for this date.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {selectedDatePosts.map((schedule) => (
                    <div key={schedule.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-slate-900">{schedule.posts?.title}</h4>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(schedule.scheduled_at), "h:mm a")}
                            </span>
                            <span className="capitalize">{schedule.posts?.post_type}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-wrap justify-end max-w-[150px]">
                          {schedule.posts?.post_channels?.map((ch: any) => (
                            <Badge key={ch.id} variant="secondary" className="capitalize text-[10px] bg-slate-100 text-slate-600">
                              {ch.platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
