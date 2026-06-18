/**
 * Hand-written DB row types mirroring `supabase/schema.sql`.
 * (Kept lean + stable; regenerate with `supabase gen types` if preferred.)
 */
import type {
  Platform,
  PostType,
  PostStatus,
  IdeaStatus,
  Priority,
} from "@/lib/demo-data";

export type { Platform, PostType, PostStatus, IdeaStatus, Priority };

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string | null;
  plan: "starter" | "pro" | "agency";
  owner_id: string;
  /** Stripe billing (Phase 5) — null until the workspace subscribes. */
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostRow {
  id: string;
  workspace_id: string;
  created_by: string | null;
  title: string;
  topic: string | null;
  post_type: PostType;
  status: PostStatus;
  instagram_caption: string | null;
  linkedin_caption: string | null;
  universal_caption: string | null;
  hashtags: string | null;
  cta: string | null;
  notes: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  /** Joined from post_channels when selected. */
  platforms?: Platform[];
}

export interface PostChannel {
  id: string;
  workspace_id: string;
  post_id: string;
  platform: Platform;
  enabled: boolean;
}

export interface MediaAssetRow {
  id: string;
  workspace_id: string;
  created_by: string | null;
  name: string;
  kind: "image" | "video" | "thumbnail" | "carousel" | "zip";
  bucket: string;
  path: string | null;
  url: string | null;
  size_bytes: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  dimensions: string | null;
  linked_post_id: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentIdeaRow {
  id: string;
  workspace_id: string;
  created_by: string | null;
  title: string;
  category: string | null;
  source_trend: string | null;
  priority: Priority;
  content_type: PostType;
  status: IdeaStatus | "archived";
  notes: string | null;
  converted_post_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrendRow {
  id: string;
  workspace_id: string;
  created_by: string | null;
  tag: string;
  category: string | null;
  relevance: number;
  growth: string | null;
  momentum: "rising" | "peaking" | "steady" | null;
  platform: Platform | null;
  source: string | null;
  note: string | null;
  status: "active" | "saved" | "archived";
  created_at: string;
  updated_at: string;
}

export interface CompetitorRow {
  id: string;
  workspace_id: string;
  created_by: string | null;
  name: string;
  handle: string | null;
  platform: Platform | null;
  niche: string | null;
  url: string | null;
  followers: string | null;
  posts_per_week: number;
  avg_engagement: string | null;
  top_format: PostType | null;
  notes: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompetitorPostRow {
  id: string;
  workspace_id: string;
  competitor_id: string | null;
  title: string | null;
  format: PostType | null;
  hook: string | null;
  engagement: string | null;
  note: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
}

export interface InboxRow {
  id: string;
  workspace_id: string;
  platform: Platform;
  type: "comment" | "dm" | "mention";
  author_name: string | null;
  author_handle: string | null;
  content: string | null;
  sentiment: "positive" | "neutral" | "negative";
  status: "new" | "replied" | "ignored";
  related_post_id: string | null;
  suggested_reply: string | null;
  reply_draft: string | null;
  received_at: string | null;
  created_at: string;
  updated_at: string;
}

/** General automation trigger types (Phase 6); legacy DM rows leave this null. */
export type AutomationTriggerType =
  | "inbox-keyword"
  | "content-pool-queue"
  | "recurring-post"
  | "media-to-draft"
  | "failed-publish-alert"
  | "idea-ready-to-draft"
  | "competitor-post-to-idea";

/** Safe internal actions the engine can perform (no external send/publish). */
export type AutomationActionType =
  | "create-draft-post"
  | "queue-scheduled-post"
  | "inbox-suggested-reply"
  | "create-content-idea"
  | "write-log"
  | "notify";

export interface AutomationRow {
  id: string;
  workspace_id: string;
  created_by: string | null;
  name: string;
  /** Legacy DM automation type (kept for back-compat with the inbox runner). */
  type: "dm-keyword" | "comment-reply" | "lead-capture";
  description: string | null;
  trigger: string | null;
  /** Phase 6 — general engine fields (null/`{}` on legacy DM rows). */
  trigger_type: AutomationTriggerType | null;
  conditions: Record<string, unknown> | null;
  action_type: AutomationActionType | null;
  action_config: Record<string, unknown> | null;
  active: boolean;
  requires_approval: boolean;
  runs: number;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationLogRow {
  id: string;
  workspace_id: string;
  rule_id: string | null;
  run_id: string;
  status: "success" | "skipped" | "pending" | "failed" | "dry_run";
  action_taken: string | null;
  error_message: string | null;
  created_at: string;
}

export interface ScheduledPostRow {
  id: string;
  workspace_id: string;
  post_id: string;
  created_by: string | null;
  mode: "now" | "next_queue" | "custom";
  scheduled_at: string | null;
  status: "queued" | "processing" | "posted" | "failed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface PublishingJobRow {
  id: string;
  workspace_id: string;
  scheduled_post_id: string | null;
  post_id: string | null;
  platform: Platform;
  status: "queued" | "processing" | "posted" | "failed" | "cancelled";
  attempts: number;
  run_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface SettingsRow {
  id: string;
  workspace_id: string;
  brand_name: string | null;
  tagline: string | null;
  default_tone: string | null;
  default_cta: string | null;
  default_hashtags: string | null;
  ai_provider: string | null;
  webhook_url: string | null;
  timezone: string | null;
  notification_prefs: Record<string, boolean> | null;
  posting_prefs: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectedAccountRow {
  id: string;
  workspace_id: string;
  platform: string;
  account_name: string | null;
  account_handle: string | null;
  external_id: string | null;
  status: "connected" | "available" | "error";
  connected_by: string | null;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}
