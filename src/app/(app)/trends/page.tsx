"use client";

import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TrendsPage() {
  const trends = [
    { topic: "AI Agents", volume: "124K", sentiment: "positive", trend: "up" },
    { topic: "Next.js 15", volume: "89K", sentiment: "neutral", trend: "stable" },
    { topic: "Remote Work", volume: "45K", sentiment: "negative", trend: "down" },
    { topic: "SaaS Design", volume: "32K", sentiment: "positive", trend: "up" },
  ];

  return (
    <div className="space-y-6">
      <PageTitle title="Trend Radar" description="Discover what's trending in your niche to inspire your next post." />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {trends.map((trend, i) => (
          <Card key={i} className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-900">{trend.topic}</CardTitle>
              {trend.trend === "up" && <TrendingUp className="h-5 w-5 text-emerald-500" />}
              {trend.trend === "down" && <TrendingDown className="h-5 w-5 text-red-500" />}
              {trend.trend === "stable" && <Minus className="h-5 w-5 text-slate-400" />}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                  {trend.volume} mentions
                </Badge>
                <span className="text-sm text-slate-500 capitalize">
                  Sentiment: <strong className={
                    trend.sentiment === 'positive' ? 'text-emerald-600' : 
                    trend.sentiment === 'negative' ? 'text-red-600' : 'text-slate-600'
                  }>{trend.sentiment}</strong>
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
