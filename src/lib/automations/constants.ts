import type {
  AutomationTriggerType,
  AutomationActionType,
} from "@/lib/db/types";

/**
 * Phase 6 — automation engine catalog (shared client + server).
 *
 * Pure data/types only — NO `server-only` import — so the Automations client
 * view and the server engine can both read it. Describes the safe trigger →
 * action pairings, the form fields each trigger needs, and the one-click
 * templates that prefill the create form.
 */

export type { AutomationTriggerType, AutomationActionType };

export const TRIGGER_TYPES: AutomationTriggerType[] = [
  "inbox-keyword",
  "content-pool-queue",
  "recurring-post",
  "media-to-draft",
  "failed-publish-alert",
  "idea-ready-to-draft",
  "competitor-post-to-idea",
];

export const ACTION_TYPES: AutomationActionType[] = [
  "create-draft-post",
  "queue-scheduled-post",
  "inbox-suggested-reply",
  "create-content-idea",
  "write-log",
  "notify",
];

/** A configurable field rendered in the create/edit form for a trigger. */
export interface TriggerField {
  /** Dotted path under `conditions` or `actionConfig` (e.g. "conditions.keyword"). */
  key: string;
  label: string;
  kind: "text" | "textarea" | "number" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
  optional?: boolean;
  help?: string;
}

export interface TriggerMeta {
  label: string;
  /** Short human description of what the trigger fires on. */
  description: string;
  /** The action this trigger performs (fixed — keeps the engine safe). */
  action: AutomationActionType;
  /** Whether this trigger can ever lead to an external publish (gated by approval). */
  canPublish: boolean;
  /** Default for `approval_required` when creating from scratch. */
  approvalDefault: boolean;
  /** Extra condition/config fields to render in the form. */
  fields: TriggerField[];
}

const POST_TYPE_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "image", label: "Image" },
  { value: "carousel", label: "Carousel" },
  { value: "video", label: "Video" },
  { value: "reel", label: "Reel" },
  { value: "story", label: "Story" },
];

const FREQUENCY_OPTIONS = [
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

const MEDIA_KIND_OPTIONS = [
  { value: "", label: "Any media" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "carousel", label: "Carousels" },
];

export const TRIGGER_META: Record<AutomationTriggerType, TriggerMeta> = {
  "inbox-keyword": {
    label: "Inbox keyword → reply draft",
    description: "When a new inbox comment/DM contains your keyword, draft a suggested reply for review.",
    action: "inbox-suggested-reply",
    canPublish: false,
    approvalDefault: true,
    fields: [
      { key: "conditions.keyword", label: "Keyword", kind: "text", placeholder: "pricing" },
      {
        key: "actionConfig.replyTemplate",
        label: "Suggested reply",
        kind: "textarea",
        placeholder: "Thanks for reaching out! Here are the details…",
        optional: true,
        help: "Left as a draft in the inbox — never sent automatically.",
      },
    ],
  },
  "content-pool-queue": {
    label: "Auto-queue from content pool",
    description: "Queue ready posts from your content pool into the next open posting slot.",
    action: "queue-scheduled-post",
    canPublish: true,
    approvalDefault: true,
    fields: [
      {
        key: "conditions.limit",
        label: "Max posts per run",
        kind: "number",
        placeholder: "1",
        optional: true,
      },
      {
        key: "conditions.postType",
        label: "Only this post type",
        kind: "select",
        options: [{ value: "", label: "Any type" }, ...POST_TYPE_OPTIONS],
        optional: true,
      },
    ],
  },
  "recurring-post": {
    label: "Recurring scheduled post",
    description: "Create a fresh draft from a template on a cadence and queue it for posting.",
    action: "queue-scheduled-post",
    canPublish: true,
    approvalDefault: true,
    fields: [
      { key: "conditions.frequency", label: "Frequency", kind: "select", options: FREQUENCY_OPTIONS },
      { key: "actionConfig.title", label: "Post title", kind: "text", placeholder: "Weekly insight" },
      {
        key: "actionConfig.caption",
        label: "Caption template",
        kind: "textarea",
        placeholder: "This week's thought on…",
        optional: true,
      },
      {
        key: "actionConfig.postType",
        label: "Post type",
        kind: "select",
        options: POST_TYPE_OPTIONS,
        optional: true,
      },
    ],
  },
  "media-to-draft": {
    label: "New media → draft post",
    description: "When new media is uploaded, create a draft post and attach it for you to finish.",
    action: "create-draft-post",
    canPublish: false,
    approvalDefault: false,
    fields: [
      {
        key: "conditions.kind",
        label: "Only this media kind",
        kind: "select",
        options: MEDIA_KIND_OPTIONS,
        optional: true,
      },
    ],
  },
  "failed-publish-alert": {
    label: "Failed publish → alert",
    description: "When a publish job fails, write a log entry and notify your workspace webhook.",
    action: "notify",
    canPublish: false,
    approvalDefault: false,
    fields: [],
  },
  "idea-ready-to-draft": {
    label: "Idea ready → draft post",
    description: "When a content idea is marked ready, turn it into a draft post.",
    action: "create-draft-post",
    canPublish: false,
    approvalDefault: false,
    fields: [],
  },
  "competitor-post-to-idea": {
    label: "Competitor post → idea",
    description: "When you save a competitor post, capture it as a content idea to riff on later.",
    action: "create-content-idea",
    canPublish: false,
    approvalDefault: false,
    fields: [],
  },
};

export const ACTION_LABEL: Record<AutomationActionType, string> = {
  "create-draft-post": "Create draft post",
  "queue-scheduled-post": "Queue scheduled post",
  "inbox-suggested-reply": "Draft inbox reply",
  "create-content-idea": "Create content idea",
  "write-log": "Write log entry",
  notify: "Notify workspace",
};

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  triggerType: AutomationTriggerType;
  approvalRequired: boolean;
  /** Suggested human-readable trigger label stored on the rule. */
  trigger: string;
  conditions: Record<string, unknown>;
  actionConfig: Record<string, unknown>;
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: "tpl-weekly-linkedin",
    name: "Weekly LinkedIn thought leadership",
    description: "Draft and queue a weekly thought-leadership post for review before it goes out.",
    triggerType: "recurring-post",
    approvalRequired: true,
    trigger: "Every week",
    conditions: { frequency: "weekly" },
    actionConfig: {
      title: "Weekly thought leadership",
      caption: "Here's one idea worth sharing this week…",
      postType: "text",
    },
  },
  {
    id: "tpl-daily-ai-tip",
    name: "Daily AI tip post queue",
    description: "Auto-queue one ready post from your content pool into the next slot each day.",
    triggerType: "content-pool-queue",
    approvalRequired: true,
    trigger: "Ready posts in pool",
    conditions: { limit: 1 },
    actionConfig: {},
  },
  {
    id: "tpl-inbox-keyword",
    name: "Inbox keyword reply suggestion",
    description: "Draft a suggested reply whenever a comment or DM mentions your keyword.",
    triggerType: "inbox-keyword",
    approvalRequired: true,
    trigger: "Keyword: pricing",
    conditions: { keyword: "pricing" },
    actionConfig: {
      replyTemplate: "Thanks for reaching out! Sending pricing details your way.",
    },
  },
  {
    id: "tpl-failed-publish",
    name: "Failed publish alert",
    description: "Log and notify your workspace whenever a publish job fails.",
    triggerType: "failed-publish-alert",
    approvalRequired: false,
    trigger: "Publish job failed",
    conditions: {},
    actionConfig: {},
  },
  {
    id: "tpl-media-draft",
    name: "Media upload to draft",
    description: "Turn every new media upload into a draft post, ready for you to finish.",
    triggerType: "media-to-draft",
    approvalRequired: false,
    trigger: "New media uploaded",
    conditions: {},
    actionConfig: {},
  },
  {
    id: "tpl-competitor-idea",
    name: "Competitor post saved to idea",
    description: "Capture saved competitor posts as content ideas you can build on.",
    triggerType: "competitor-post-to-idea",
    approvalRequired: false,
    trigger: "Competitor post saved",
    conditions: {},
    actionConfig: {},
  },
];
