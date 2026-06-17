-- ============================================================================
-- SocialFlow AI — Phase 2 database schema
-- Workspace-aware, RLS-protected SaaS foundation.
--
-- Safe to run multiple times (idempotent): uses IF NOT EXISTS / CREATE OR
-- REPLACE / DROP POLICY IF EXISTS. Apply in the Supabase SQL editor or via the
-- Supabase CLI / MCP. See README "Database setup".
--
-- Conventions:
--   * UUID primary keys (gen_random_uuid()).
--   * created_at / updated_at timestamptz on every table (updated_at via trigger).
--   * workspace_id on every tenant-scoped table; RLS restricts rows to members
--     of workspaces the current user belongs to (public.is_workspace_member).
--   * status / platform / post_type modeled as text + CHECK constraints.
-- ============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";      -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- Shared helpers
-- ----------------------------------------------------------------------------

-- Keeps updated_at current on UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- True when the current user is a member of the given workspace.
-- SECURITY DEFINER so it can read workspace_members without tripping that
-- table's own RLS (prevents infinite recursion in policies).
create or replace function public.is_workspace_member(ws uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid()
  );
$$;

-- True when the current user owns/administers the given workspace.
create or replace function public.is_workspace_admin(ws uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  );
$$;

-- ============================================================================
-- 1. profiles — one row per auth user (mirrors auth.users).
-- ============================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  role        text not null default 'member',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.profiles is 'User profile, keyed to auth.users.id.';

-- ============================================================================
-- 2. workspaces — top-level tenant. All app data hangs off a workspace.
-- ============================================================================
create table if not exists public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text,
  plan        text not null default 'starter' check (plan in ('starter','pro','agency')),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.workspaces is 'Tenant boundary; every record below is scoped to a workspace.';
create index if not exists idx_workspaces_owner on public.workspaces (owner_id);
create index if not exists idx_workspaces_created_at on public.workspaces (created_at);

-- ============================================================================
-- 3. workspace_members — membership + role join table.
-- ============================================================================
create table if not exists public.workspace_members (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  role          text not null default 'editor' check (role in ('owner','admin','editor','viewer')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (workspace_id, user_id)
);
comment on table public.workspace_members is 'Which users belong to which workspace, and their role.';
create index if not exists idx_workspace_members_workspace on public.workspace_members (workspace_id);
create index if not exists idx_workspace_members_user on public.workspace_members (user_id);

-- ============================================================================
-- 4. posts — core content record (multi-platform captions live inline).
-- ============================================================================
create table if not exists public.posts (
  id                 uuid primary key default gen_random_uuid(),
  workspace_id       uuid not null references public.workspaces (id) on delete cascade,
  created_by         uuid references auth.users (id) on delete set null,
  title              text not null default 'Untitled post',
  topic              text,
  post_type          text not null default 'text' check (post_type in ('carousel','image','video','text','reel','story')),
  status             text not null default 'draft' check (status in ('draft','ready','scheduled','posted','failed','archived')),
  instagram_caption  text,
  linkedin_caption   text,
  universal_caption  text,
  hashtags           text,
  cta                text,
  notes              text,
  scheduled_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
comment on table public.posts is 'A unit of content; channels selected via post_channels, scheduling via scheduled_posts.';
create index if not exists idx_posts_workspace on public.posts (workspace_id);
create index if not exists idx_posts_status on public.posts (status);
create index if not exists idx_posts_post_type on public.posts (post_type);
create index if not exists idx_posts_scheduled_at on public.posts (scheduled_at);
create index if not exists idx_posts_created_at on public.posts (created_at);
create index if not exists idx_posts_created_by on public.posts (created_by);

-- ============================================================================
-- 5. post_channels — which platforms a post targets.
-- ============================================================================
create table if not exists public.post_channels (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  post_id       uuid not null references public.posts (id) on delete cascade,
  platform      text not null check (platform in ('instagram','facebook','linkedin','youtube','tiktok','x')),
  enabled       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (post_id, platform)
);
comment on table public.post_channels is 'Per-post platform targets (cross-posting).';
create index if not exists idx_post_channels_workspace on public.post_channels (workspace_id);
create index if not exists idx_post_channels_post on public.post_channels (post_id);
create index if not exists idx_post_channels_platform on public.post_channels (platform);

-- ============================================================================
-- 6. media_assets — uploaded files (in Supabase Storage), optionally linked.
-- ============================================================================
create table if not exists public.media_assets (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces (id) on delete cascade,
  created_by     uuid references auth.users (id) on delete set null,
  name           text not null,
  kind           text not null default 'image' check (kind in ('image','video','thumbnail','carousel','zip')),
  bucket         text not null default 'media',
  path           text,
  url            text,
  size_bytes     bigint,
  mime_type      text,
  width          integer,
  height         integer,
  dimensions     text,
  linked_post_id uuid references public.posts (id) on delete set null,
  archived       boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
comment on table public.media_assets is 'Storage-backed media; path/url point at a Storage bucket object.';
create index if not exists idx_media_workspace on public.media_assets (workspace_id);
create index if not exists idx_media_kind on public.media_assets (kind);
create index if not exists idx_media_linked_post on public.media_assets (linked_post_id);
create index if not exists idx_media_created_at on public.media_assets (created_at);

-- ============================================================================
-- 7. scheduled_posts — scheduling intent for a post.
-- ============================================================================
create table if not exists public.scheduled_posts (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  post_id       uuid not null references public.posts (id) on delete cascade,
  created_by    uuid references auth.users (id) on delete set null,
  mode          text not null default 'custom' check (mode in ('now','next_queue','custom')),
  scheduled_at  timestamptz,
  status        text not null default 'queued' check (status in ('queued','processing','posted','failed','cancelled')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.scheduled_posts is 'When/how a post should publish; spawns publishing_jobs per platform.';
create index if not exists idx_scheduled_workspace on public.scheduled_posts (workspace_id);
create index if not exists idx_scheduled_post on public.scheduled_posts (post_id);
create index if not exists idx_scheduled_status on public.scheduled_posts (status);
create index if not exists idx_scheduled_at on public.scheduled_posts (scheduled_at);

-- ============================================================================
-- 8. publishing_jobs — one job per (scheduled_post, platform); runner unit.
-- ============================================================================
create table if not exists public.publishing_jobs (
  id                 uuid primary key default gen_random_uuid(),
  workspace_id       uuid not null references public.workspaces (id) on delete cascade,
  scheduled_post_id  uuid references public.scheduled_posts (id) on delete cascade,
  post_id            uuid references public.posts (id) on delete cascade,
  platform           text not null check (platform in ('instagram','facebook','linkedin','youtube','tiktok','x')),
  status             text not null default 'queued' check (status in ('queued','processing','posted','failed','cancelled')),
  attempts           integer not null default 0,
  run_at             timestamptz,
  error_message      text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
comment on table public.publishing_jobs is 'API-ready job records for the scheduler/runner (no real publishing yet).';
create index if not exists idx_jobs_workspace on public.publishing_jobs (workspace_id);
create index if not exists idx_jobs_status on public.publishing_jobs (status);
create index if not exists idx_jobs_platform on public.publishing_jobs (platform);
create index if not exists idx_jobs_run_at on public.publishing_jobs (run_at);
create index if not exists idx_jobs_scheduled_post on public.publishing_jobs (scheduled_post_id);

-- ============================================================================
-- 9. publishing_logs — append-only audit/error log per job.
-- ============================================================================
create table if not exists public.publishing_logs (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  job_id        uuid references public.publishing_jobs (id) on delete cascade,
  level         text not null default 'info' check (level in ('info','warning','error')),
  message       text not null,
  payload       jsonb,
  created_at    timestamptz not null default now()
);
comment on table public.publishing_logs is 'Append-only log of publishing job events/errors.';
create index if not exists idx_logs_workspace on public.publishing_logs (workspace_id);
create index if not exists idx_logs_job on public.publishing_logs (job_id);
create index if not exists idx_logs_created_at on public.publishing_logs (created_at);

-- ============================================================================
-- 10. connected_accounts — a connected social/AI/automation integration.
-- ============================================================================
create table if not exists public.connected_accounts (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  platform        text not null,
  account_name    text,
  account_handle  text,
  external_id     text,
  status          text not null default 'available' check (status in ('connected','available','error')),
  connected_by    uuid references auth.users (id) on delete set null,
  last_sync_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table public.connected_accounts is 'Integration connection state (placeholder; no real OAuth yet — Phase 3).';
create index if not exists idx_accounts_workspace on public.connected_accounts (workspace_id);
create index if not exists idx_accounts_platform on public.connected_accounts (platform);
create index if not exists idx_accounts_status on public.connected_accounts (status);

-- ============================================================================
-- 11. social_tokens — OAuth tokens (SENSITIVE; Phase 3 will encrypt + lock down).
-- ============================================================================
create table if not exists public.social_tokens (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references public.workspaces (id) on delete cascade,
  connected_account_id  uuid references public.connected_accounts (id) on delete cascade,
  access_token          text,
  refresh_token         text,
  scope                 text,
  expires_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
comment on table public.social_tokens is 'OAuth tokens. SENSITIVE: keep server-only; encrypt + restrict to admins in Phase 3. Do NOT store real tokens yet.';
create index if not exists idx_tokens_workspace on public.social_tokens (workspace_id);
create index if not exists idx_tokens_account on public.social_tokens (connected_account_id);

-- ============================================================================
-- 12. platform_permissions — granted scopes/permissions per connection.
-- ============================================================================
create table if not exists public.platform_permissions (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references public.workspaces (id) on delete cascade,
  connected_account_id  uuid references public.connected_accounts (id) on delete cascade,
  platform              text not null,
  permission            text not null,
  granted               boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
comment on table public.platform_permissions is 'Per-connection capability/scope flags (placeholder).';
create index if not exists idx_perms_workspace on public.platform_permissions (workspace_id);
create index if not exists idx_perms_platform on public.platform_permissions (platform);

-- ============================================================================
-- 13. trends — tracked/manual trend signals.
-- ============================================================================
create table if not exists public.trends (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  created_by    uuid references auth.users (id) on delete set null,
  tag           text not null,
  category      text,
  relevance     integer default 0,
  growth        text,
  momentum      text check (momentum in ('rising','peaking','steady')),
  platform      text,
  source        text,
  note          text,
  status        text not null default 'active' check (status in ('active','saved','archived')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.trends is 'Trend radar signals (manual records now; feeds Phase 3 trend ingestion).';
create index if not exists idx_trends_workspace on public.trends (workspace_id);
create index if not exists idx_trends_platform on public.trends (platform);
create index if not exists idx_trends_status on public.trends (status);
create index if not exists idx_trends_created_at on public.trends (created_at);

-- ============================================================================
-- 14. content_ideas — idea backlog.
-- ============================================================================
create table if not exists public.content_ideas (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  created_by    uuid references auth.users (id) on delete set null,
  title         text not null,
  category      text,
  source_trend  text,
  priority      text not null default 'medium' check (priority in ('low','medium','high')),
  content_type  text not null default 'text' check (content_type in ('carousel','image','video','text','reel','story')),
  status        text not null default 'idea' check (status in ('idea','draft','ready','scheduled','posted','archived')),
  notes         text,
  converted_post_id uuid references public.posts (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.content_ideas is 'Idea backlog; converts into posts (converted_post_id).';
create index if not exists idx_ideas_workspace on public.content_ideas (workspace_id);
create index if not exists idx_ideas_status on public.content_ideas (status);
create index if not exists idx_ideas_priority on public.content_ideas (priority);
create index if not exists idx_ideas_created_at on public.content_ideas (created_at);

-- ============================================================================
-- 15. ai_generations — saved AI generation history (Phase 3A: live providers).
-- ============================================================================
create table if not exists public.ai_generations (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces (id) on delete cascade,
  created_by     uuid references auth.users (id) on delete set null,
  tool           text not null,
  prompt         text,
  output         text,
  metadata       jsonb,
  -- Phase 3A: provider/model + structured I/O + run status.
  provider       text,
  model          text,
  status         text not null default 'success'
                 check (status in ('success','demo','failed')),
  error_message  text,
  prompt_version text,
  input          jsonb,
  output_json    jsonb,
  created_at     timestamptz not null default now()
);
comment on table public.ai_generations is 'History of AI tool runs (Phase 3A wires OpenAI/Anthropic providers).';
comment on column public.ai_generations.provider is 'AI provider used (openai|anthropic), null for demo.';
comment on column public.ai_generations.model is 'Model id used for the generation.';
comment on column public.ai_generations.status is 'success | demo | failed.';
comment on column public.ai_generations.prompt_version is 'Prompt template version for reproducibility.';
comment on column public.ai_generations.input is 'Structured generation input (tool, topic, audience, etc.).';
comment on column public.ai_generations.output_json is 'Structured generation output (variations, raw text).';
create index if not exists idx_ai_workspace on public.ai_generations (workspace_id);
create index if not exists idx_ai_created_at on public.ai_generations (created_at);

-- ============================================================================
-- 16. analytics_snapshots — point-in-time metrics (manual now).
-- ============================================================================
create table if not exists public.analytics_snapshots (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  post_id       uuid references public.posts (id) on delete cascade,
  platform      text,
  captured_at   timestamptz not null default now(),
  reach         bigint default 0,
  impressions   bigint default 0,
  engagement    bigint default 0,
  saves         bigint default 0,
  shares        bigint default 0,
  comments      bigint default 0,
  clicks        bigint default 0,
  followers     bigint default 0,
  metrics       jsonb,
  created_at    timestamptz not null default now()
);
comment on table public.analytics_snapshots is 'Workspace/post-level metric snapshots (manual; Phase 3 syncs platform analytics).';
create index if not exists idx_analytics_workspace on public.analytics_snapshots (workspace_id);
create index if not exists idx_analytics_post on public.analytics_snapshots (post_id);
create index if not exists idx_analytics_platform on public.analytics_snapshots (platform);
create index if not exists idx_analytics_captured_at on public.analytics_snapshots (captured_at);

-- ============================================================================
-- 17. comments_inbox — unified comments/DMs/mentions.
-- ============================================================================
create table if not exists public.comments_inbox (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  platform        text not null,
  type            text not null default 'comment' check (type in ('comment','dm','mention')),
  author_name     text,
  author_handle   text,
  content         text,
  sentiment       text default 'neutral' check (sentiment in ('positive','neutral','negative')),
  status          text not null default 'new' check (status in ('new','replied','ignored')),
  related_post_id uuid references public.posts (id) on delete set null,
  suggested_reply text,
  reply_draft     text,
  external_id     text,
  received_at     timestamptz default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table public.comments_inbox is 'Unified inbox items (Phase 3F syncs real comment APIs into this).';
comment on column public.comments_inbox.external_id is 'Provider comment/DM id for idempotent sync (Phase 3F).';
create index if not exists idx_inbox_workspace on public.comments_inbox (workspace_id);
create unique index if not exists uq_inbox_external
  on public.comments_inbox (workspace_id, platform, external_id)
  where external_id is not null;
create index if not exists idx_inbox_platform on public.comments_inbox (platform);
create index if not exists idx_inbox_status on public.comments_inbox (status);
create index if not exists idx_inbox_created_at on public.comments_inbox (created_at);

-- ============================================================================
-- 18. dm_automations — safe, approval-based automations.
-- ============================================================================
create table if not exists public.dm_automations (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.workspaces (id) on delete cascade,
  created_by        uuid references auth.users (id) on delete set null,
  name              text not null,
  type              text not null default 'dm-keyword' check (type in ('dm-keyword','comment-reply','lead-capture')),
  description       text,
  trigger           text,
  active            boolean not null default false,
  requires_approval boolean not null default true,
  runs              integer not null default 0,
  last_run_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
comment on table public.dm_automations is 'Approval-based automation definitions (no mass/spam automation).';
create index if not exists idx_automations_workspace on public.dm_automations (workspace_id);
create index if not exists idx_automations_active on public.dm_automations (active);

-- ============================================================================
-- 19. competitors — tracked competitor profiles.
-- ============================================================================
create table if not exists public.competitors (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  created_by      uuid references auth.users (id) on delete set null,
  name            text not null,
  handle          text,
  platform        text,
  niche           text,
  url             text,
  followers       text,
  posts_per_week  integer default 0,
  avg_engagement  text,
  top_format      text,
  notes           text,
  archived        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table public.competitors is 'Competitor profiles being benchmarked (no scraping).';
create index if not exists idx_competitors_workspace on public.competitors (workspace_id);
create index if not exists idx_competitors_platform on public.competitors (platform);
create index if not exists idx_competitors_created_at on public.competitors (created_at);

-- ============================================================================
-- 20. competitor_posts — saved competitor content + analysis notes.
-- ============================================================================
create table if not exists public.competitor_posts (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces (id) on delete cascade,
  competitor_id  uuid references public.competitors (id) on delete cascade,
  title          text,
  format         text,
  hook           text,
  engagement     text,
  note           text,
  url            text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
comment on table public.competitor_posts is 'Saved competitor posts with hook/format/engagement analysis.';
create index if not exists idx_competitor_posts_workspace on public.competitor_posts (workspace_id);
create index if not exists idx_competitor_posts_competitor on public.competitor_posts (competitor_id);

-- ============================================================================
-- 21. settings — one row per workspace (brand + defaults + placeholders).
-- ============================================================================
create table if not exists public.settings (
  id                 uuid primary key default gen_random_uuid(),
  workspace_id       uuid not null unique references public.workspaces (id) on delete cascade,
  brand_name         text,
  tagline            text,
  default_tone       text,
  default_cta        text,
  default_hashtags   text,
  ai_provider        text,
  webhook_url        text,
  timezone           text default 'UTC',
  notification_prefs jsonb,
  posting_prefs      jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
comment on table public.settings is 'Per-workspace brand settings, defaults, and integration placeholders.';
create index if not exists idx_settings_workspace on public.settings (workspace_id);

-- ----------------------------------------------------------------------------
-- updated_at triggers (drop + recreate so re-runs stay clean)
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'profiles','workspaces','workspace_members','posts','post_channels',
    'media_assets','scheduled_posts','publishing_jobs','connected_accounts',
    'social_tokens','platform_permissions','trends','content_ideas',
    'comments_inbox','dm_automations','competitors','competitor_posts','settings'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t);
  end loop;
end;
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles            enable row level security;
alter table public.workspaces           enable row level security;
alter table public.workspace_members    enable row level security;
alter table public.posts                 enable row level security;
alter table public.post_channels         enable row level security;
alter table public.media_assets          enable row level security;
alter table public.scheduled_posts       enable row level security;
alter table public.publishing_jobs       enable row level security;
alter table public.publishing_logs       enable row level security;
alter table public.connected_accounts    enable row level security;
alter table public.social_tokens         enable row level security;
alter table public.platform_permissions  enable row level security;
alter table public.trends                 enable row level security;
alter table public.content_ideas          enable row level security;
alter table public.ai_generations          enable row level security;
alter table public.analytics_snapshots     enable row level security;
alter table public.comments_inbox           enable row level security;
alter table public.dm_automations            enable row level security;
alter table public.competitors                enable row level security;
alter table public.competitor_posts            enable row level security;
alter table public.settings                     enable row level security;

-- profiles: each user manages their own row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- workspaces: members can read; owner can create; admins can update/delete.
drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member" on public.workspaces
  for select using (public.is_workspace_member(id));
drop policy if exists "workspaces_insert_owner" on public.workspaces;
create policy "workspaces_insert_owner" on public.workspaces
  for insert with check (owner_id = auth.uid());
drop policy if exists "workspaces_update_admin" on public.workspaces;
create policy "workspaces_update_admin" on public.workspaces
  for update using (public.is_workspace_admin(id)) with check (public.is_workspace_admin(id));
drop policy if exists "workspaces_delete_admin" on public.workspaces;
create policy "workspaces_delete_admin" on public.workspaces
  for delete using (public.is_workspace_admin(id));

-- workspace_members: members can read membership; a user can add themselves
-- (bootstrap), admins manage others.
drop policy if exists "members_select" on public.workspace_members;
create policy "members_select" on public.workspace_members
  for select using (public.is_workspace_member(workspace_id));
drop policy if exists "members_insert" on public.workspace_members;
create policy "members_insert" on public.workspace_members
  for insert with check (user_id = auth.uid() or public.is_workspace_admin(workspace_id));
drop policy if exists "members_update_admin" on public.workspace_members;
create policy "members_update_admin" on public.workspace_members
  for update using (public.is_workspace_admin(workspace_id));
drop policy if exists "members_delete_admin" on public.workspace_members;
create policy "members_delete_admin" on public.workspace_members
  for delete using (public.is_workspace_admin(workspace_id) or user_id = auth.uid());

-- All other workspace-scoped tables: full access to workspace members.
-- (Applied uniformly via a loop: SELECT/INSERT/UPDATE/DELETE gated on membership.)
do $$
declare
  t text;
  tables text[] := array[
    'posts','post_channels','media_assets','scheduled_posts','publishing_jobs',
    'publishing_logs','connected_accounts','social_tokens','platform_permissions',
    'trends','content_ideas','ai_generations','analytics_snapshots',
    'comments_inbox','dm_automations','competitors','competitor_posts','settings'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists "%s_member_all" on public.%I;', t, t);
    execute format(
      'create policy "%s_member_all" on public.%I
         for all
         using (public.is_workspace_member(workspace_id))
         with check (public.is_workspace_member(workspace_id));', t, t);
  end loop;
end;
$$;

-- ============================================================================
-- Storage buckets + policies
-- ============================================================================
insert into storage.buckets (id, name, public)
values
  ('media','media', true),
  ('thumbnails','thumbnails', true),
  ('carousels','carousels', true),
  ('videos','videos', true),
  ('zips','zips', false)
on conflict (id) do nothing;

-- Public read for the public buckets; authenticated users may write/manage.
drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read" on storage.objects
  for select using (bucket_id in ('media','thumbnails','carousels','videos'));

drop policy if exists "storage_auth_insert" on storage.objects;
create policy "storage_auth_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('media','thumbnails','carousels','videos','zips'));

drop policy if exists "storage_auth_update" on storage.objects;
create policy "storage_auth_update" on storage.objects
  for update to authenticated
  using (bucket_id in ('media','thumbnails','carousels','videos','zips'));

drop policy if exists "storage_auth_delete" on storage.objects;
create policy "storage_auth_delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('media','thumbnails','carousels','videos','zips'));

-- Private bucket (zips) read restricted to authenticated users.
drop policy if exists "storage_zips_read_auth" on storage.objects;
create policy "storage_zips_read_auth" on storage.objects
  for select to authenticated using (bucket_id = 'zips');

-- ============================================================================
-- Auto-provision a profile row when a new auth user is created.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Shrink the RPC surface: handle_new_user is trigger-only; membership helpers
-- are used inside RLS policies (authenticated keeps EXECUTE, anon does not).
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.is_workspace_member(uuid) from anon;
revoke execute on function public.is_workspace_admin(uuid) from anon;

-- ============================================================================
-- End of schema.
-- ============================================================================
