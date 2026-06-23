"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { AnalyticsExport } from "@/lib/db/analytics";
import {
  analyticsMetrics,
  platformComparison,
  analyticsTopPosts,
  platformMeta,
} from "@/lib/demo-data";

/* --------------------------------- CSV utils -------------------------------- */

function csvCell(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(csvCell).join(",");
}

function fileStamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function downloadCsv(filename: string, csv: string) {
  // Prefix a BOM so Excel renders the em dash / unicode correctly.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ------------------------------ CSV builders -------------------------------- */

/** Demo / preview export — mirrors the showcase analytics on screen. */
function buildDemoCsv(now: Date): string {
  const lines: string[] = [];
  lines.push(csvRow(["SocialFlow AI — Analytics Export"]));
  lines.push(csvRow(["Generated", now.toISOString()]));
  lines.push(csvRow(["Data source", "Demo data"]));
  lines.push("");

  lines.push(csvRow(["Summary"]));
  lines.push(csvRow(["Metric", "Value", "Change"]));
  for (const m of analyticsMetrics) lines.push(csvRow([m.label, m.value, m.delta]));
  lines.push("");

  lines.push(csvRow(["Platform breakdown"]));
  lines.push(csvRow(["Platform", "Reach", "Engagement rate", "Followers"]));
  for (const p of platformComparison) {
    lines.push(
      csvRow([platformMeta[p.platform].label, p.reach, `${p.engagement}%`, p.followers])
    );
  }
  lines.push("");

  lines.push(csvRow(["Top posts"]));
  lines.push(csvRow(["Rank", "Title", "Platform", "Reach", "Engagement", "Saves"]));
  analyticsTopPosts.forEach((post, i) => {
    lines.push(
      csvRow([
        i + 1,
        post.title,
        platformMeta[post.platform].label,
        post.reach,
        post.engagement,
        post.saves,
      ])
    );
  });

  return lines.join("\r\n");
}

const METRIC_HEADERS = [
  "Reach",
  "Impressions",
  "Engagement",
  "Saves",
  "Shares",
  "Comments",
  "Clicks",
] as const;

/** Live export — sourced from synced `analytics_snapshots`. */
function buildLiveCsv(data: AnalyticsExport, now: Date): { csv: string; rows: number } {
  const lines: string[] = [];
  lines.push(csvRow(["SocialFlow AI — Analytics Export"]));
  lines.push(csvRow(["Generated", now.toISOString()]));
  if (data.workspaceName) lines.push(csvRow(["Workspace", data.workspaceName]));
  lines.push(csvRow(["Data source", "Live"]));
  lines.push(csvRow(["Last synced", data.syncedAt ?? "Never"]));
  lines.push("");

  lines.push(csvRow(["Workspace summary"]));
  lines.push(csvRow(["Platform", "Followers", ...METRIC_HEADERS, "Captured at"]));
  if (data.workspaceRows.length === 0) {
    lines.push(csvRow(["No workspace-level analytics synced yet"]));
  } else {
    for (const r of data.workspaceRows) {
      lines.push(
        csvRow([
          r.label,
          r.followers,
          r.reach,
          r.impressions,
          r.engagement,
          r.saves,
          r.shares,
          r.comments,
          r.clicks,
          r.capturedAt,
        ])
      );
    }
  }
  lines.push("");

  lines.push(csvRow(["Post analytics"]));
  lines.push(csvRow(["Title", "Platform", ...METRIC_HEADERS, "Captured at"]));
  if (data.postRows.length === 0) {
    lines.push(csvRow(["No post-level analytics synced yet"]));
  } else {
    for (const r of data.postRows) {
      lines.push(
        csvRow([
          r.label,
          r.platform,
          r.reach,
          r.impressions,
          r.engagement,
          r.saves,
          r.shares,
          r.comments,
          r.clicks,
          r.capturedAt,
        ])
      );
    }
  }

  return { csv: lines.join("\r\n"), rows: data.workspaceRows.length + data.postRows.length };
}

/* -------------------------------- component --------------------------------- */

export function AnalyticsExportButton({ data }: { data: AnalyticsExport }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  function handleExport() {
    setBusy(true);
    try {
      const now = new Date();
      const filename = `socialflow-analytics-${fileStamp(now)}.csv`;

      if (!data.live) {
        downloadCsv(filename, buildDemoCsv(now));
        toast({
          variant: "success",
          title: "Analytics exported",
          description: `${filename} — showcase data downloaded.`,
        });
        return;
      }

      const { csv, rows } = buildLiveCsv(data, now);
      downloadCsv(filename, csv);
      if (rows === 0) {
        toast({
          variant: "info",
          title: "Exported an empty report",
          description: "No analytics synced yet — the CSV has headers ready for your first sync.",
        });
      } else {
        toast({
          variant: "success",
          title: "Analytics exported",
          description: `${filename} — ${rows} ${rows === 1 ? "row" : "rows"} downloaded.`,
        });
      }
    } catch {
      toast({
        variant: "error",
        title: "Export failed",
        description: "Something went wrong preparing the CSV. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={busy}>
      <Download className="h-4 w-4" /> {busy ? "Exporting…" : "Export"}
    </Button>
  );
}
