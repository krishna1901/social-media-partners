"use client";

import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Users } from "lucide-react";

export default function CompetitorsPage() {
  const competitors = [
    { name: "Acme Corp", platform: "Twitter", followers: "45.2K", growth: "+2.4%", status: "Active" },
    { name: "GlobalTech", platform: "LinkedIn", followers: "120K", growth: "+1.1%", status: "Active" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageTitle title="Competitor Tracking" description="Monitor what works for others in your industry." />
        <Button className="bg-slate-900 text-white hover:bg-slate-800">
          <Plus className="mr-2 h-4 w-4" /> Add Competitor
        </Button>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competitor</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Followers</TableHead>
                <TableHead>Growth (30d)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitors.map((comp, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{comp.name}</TableCell>
                  <TableCell>{comp.platform}</TableCell>
                  <TableCell>{comp.followers}</TableCell>
                  <TableCell className="text-emerald-600 font-medium">{comp.growth}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      {comp.status}
                    </span>
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
