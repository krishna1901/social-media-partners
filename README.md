# SocialFlow AI — AI Content Command Center

An AI-powered content intelligence, scheduling, analytics, inbox, competitor and
automation platform for creators, marketers, agencies and small businesses.

- **Phase 1 / 1.5 / 1.6** — premium SaaS UI (design system, 14 pages, charts,
  loading/empty states). _Merged._
- **Phase 2** _(this branch)_ — the real Supabase backend foundation: auth,
  workspace-aware schema + RLS, a typed data-access layer, CRUD server actions,
  Storage media upload, and a scheduling/job foundation. Demo data is retained
  as a fallback so the app still runs with no backend configured.

## Stack
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase
(Postgres + Auth + Storage).

## Quick start
```bash
npm install
cp .env.example .env.local   # fill in Supabase values (see below)
npm run dev                  # http://localhost:3000
```
With **no** real Supabase values the app runs in **demo/preview mode**: auth is
not enforced and every page renders the built-in demo data. Add real values to
switch on auth + live data.

## Supabase setup (project: `social`)
1. **Env** — from *Settings → API*, set in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. **Database schema** — run [`supabase/schema.sql`](./supabase/schema.sql) once.
   Either paste it into the **SQL editor** and run, or with the CLI:
   ```bash
   supabase link --project-ref ttffcglpaurhlcwfeqqz
   psql "$SUPABASE_DB_URL" -f supabase/schema.sql
   ```
   It is idempotent (safe to re-run). It creates all 21 tables, indexes,
   `updated_at` triggers, **RLS policies**, the storage buckets, and a trigger
   that auto-creates a `profiles` row for each new auth user.
   > This schema has already been applied to the live `social` project.
3. **Storage buckets** — created by the schema: `media`, `thumbnails`,
   `carousels`, `videos` (public read) and `zips` (authenticated read). No manual
   step needed.
4. **Auth** — email/password is used out of the box (`/signup`, `/login`). On
   first login the app bootstraps a `profile`, a default `workspace`, an owner
   `workspace_members` row, and a `settings` row.

## How it works
- **Config guard** (`src/lib/supabase/config.ts`) — `isSupabaseConfigured()`
  decides demo vs live mode.
- **Auth + route protection** — `src/proxy.ts` (Next 16 proxy/middleware) +
  `src/lib/supabase/middleware.ts` refresh the session and redirect
  unauthenticated users to `/login` (only when configured).
- **Data access layer** (`src/lib/db/*`) — typed `list/get/create/update/archive`
  functions, workspace-scoped, that return the same shapes the UI already uses
  and **fall back to demo data** when not configured/authenticated.
- **Server actions** (`src/app/actions/*`) — thin `"use server"` wrappers over
  the data layer with `revalidatePath`.
- **Storage** (`src/lib/storage.ts`) — validated uploads to the right bucket.
- **Scheduler** (`src/lib/publishing/*`) — `scheduled_posts` → `publishing_jobs`
  → `publishing_logs`, with per-platform **placeholder** formatters/publishers.
  No real publishing happens yet.

## Scripts
```bash
npm run dev     # dev server
npm run build   # production build (also typechecks)
npm run lint    # eslint
```

## Deployment
Deploy on Vercel. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
(and `NEXT_PUBLIC_APP_URL`) as project env vars. Without them the deployment runs
in demo mode.

## Phase 3 — TODO (intentionally not in this PR)
- Real OAuth connect flows + encrypted token storage (`connected_accounts`,
  `social_tokens`, `platform_permissions`).
- Real publishing per platform (`src/lib/publishing/platforms/*` — currently
  placeholders) + a cron/queue **job runner** that drains `publishing_jobs`.
- Real AI generation (OpenAI / Claude) behind `src/app/actions/generate.ts`,
  persisting to `ai_generations`.
- Analytics sync + comment/DM sync into `analytics_snapshots` / `comments_inbox`.
- Finish wiring the remaining list pages from demo fallback to live reads
  (the data layer + actions are ready; dashboard counts are already live).
