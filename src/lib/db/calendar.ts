import "server-only";
import { getDbContext, isLive } from "@/lib/db/context";
import type { PostRow, Platform, PostType, PostStatus } from "@/lib/db/types";
import { calendarEvents as demoCalendarEvents } from "@/lib/demo-data";

/** Demo-facing shape consumed by the calendar UI (matches demo `calendarEvents`). */
export type MappedCalendarEvent = (typeof demoCalendarEvents)[number];

/** Post row joined with its channels (as Supabase returns nested rows). */
interface PostRowWithChannels extends Omit<PostRow, "platforms"> {
  post_channels: { platform: Platform; enabled: boolean }[] | null;
}

/** Two-digit "HH:MM" from an ISO timestamp. */
function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** First enabled platform on a post, defaulting to instagram. */
function firstPlatform(
  channels: { platform: Platform; enabled: boolean }[] | null
): Platform {
  return channels?.find((c) => c.enabled)?.platform ?? "instagram";
}

/**
 * Calendar events derived from posts scheduled within the current month; demo
 * fallback when not live / on error / when there's nothing scheduled.
 */
export async function listCalendarEvents(): Promise<MappedCalendarEvent[]> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) return demoCalendarEvents;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const { data, error } = await ctx.supabase
    .from("posts")
    .select("*, post_channels(platform,enabled)")
    .eq("workspace_id", ctx.workspaceId)
    .neq("status", "archived")
    .not("scheduled_at", "is", null)
    .gte("scheduled_at", monthStart.toISOString())
    .lt("scheduled_at", monthEnd.toISOString())
    .order("scheduled_at", { ascending: true });

  if (error || !data || data.length === 0) return demoCalendarEvents;

  return (data as PostRowWithChannels[]).map((row) => {
    const when = new Date(row.scheduled_at as string);
    return {
      id: row.id,
      title: row.title,
      day: when.getDate(),
      time: formatTime(row.scheduled_at as string),
      platform: firstPlatform(row.post_channels),
      status: row.status as PostStatus,
      type: row.post_type as PostType,
    };
  });
}
