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
  → `publishing_logs`, with per-platform formatters/publishers.
- **Publishing job runner** (`src/lib/publishing/runner.ts`) — drains due
  `publishing_jobs`, claims each atomically, dispatches to the platform
  publisher, and advances status with retry + backoff and log reconciliation.
  Triggered by `POST /api/cron/publish` (cron) or the in-app "process now"
  action. Real per-platform publishing arrives in Phase 3C+; until then the
  runner records a **simulated** success so the lifecycle is observable.

## Publishing runner (Phase 3B)
- **Trigger** — `GET|POST /api/cron/publish`. The `vercel.json` cron calls it
  **daily** (`0 0 * * *`) — Vercel **Hobby** plans only allow once-per-day crons.
  For a tighter cadence, upgrade to **Pro** (e.g. `*/5 * * * *`) or point an
  external scheduler (cron-job.org, GitHub Actions, Supabase `pg_cron`) at the
  endpoint. Set `CRON_SECRET` and the endpoint requires
  `Authorization: Bearer <secret>` (Vercel Cron sends it automatically). The
  in-app "process now" action drains the current workspace on demand regardless.
- **Service role** — the cron runner uses `SUPABASE_SERVICE_ROLE_KEY` (no user
  session, bypasses RLS) via `src/lib/supabase/admin.ts`. Without it the runner
  is a safe no-op (`mode: "demo"`).
- **Simulation** — placeholder publishers report `not_implemented`; with
  `PUBLISH_SIMULATE` unset/true the runner marks those jobs *posted (simulated)*.
  Set `PUBLISH_SIMULATE=false` to fail honestly until a real publisher exists.
- **Retry** — transient failures retry up to 3× with 1m/5m/15m backoff before a
  terminal failure; parent `scheduled_posts` + `posts` roll up when all jobs end.
- **AI content generation** (`src/lib/ai/*`) — provider-based, **server-only**
  generation for the 10 Content Studio tools. Dependency-free REST calls to
  OpenAI (`/v1/chat/completions`) and Anthropic (`/v1/messages`). Every run is
  persisted to `ai_generations` (provider, model, status, input/output JSON).
- **Social OAuth** (`src/lib/integrations/*`, `src/app/api/oauth/*`) — real
  OAuth 2.0 connect flows. **LinkedIn** is fully wired (3C): sign-in + publish
  as the member via the Posts API. Tokens are **encrypted at rest**
  (`src/lib/security/crypto.ts`, AES-256-GCM) in `social_tokens` and read only
  server-side by the publishing runner.

## Social connections (Phase 3C — LinkedIn)
- **Connect** — Integrations → LinkedIn → "Connect LinkedIn" starts
  `/api/oauth/linkedin/start` → LinkedIn consent → `/api/oauth/linkedin/callback`
  stores an encrypted token + a `connected_accounts` row.
- **Config** — set `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, and
  `TOKEN_ENCRYPTION_KEY`. Register the redirect URI
  `<NEXT_PUBLIC_APP_URL>/api/oauth/linkedin/callback` in your LinkedIn app.
  Without these, LinkedIn shows as "available" and the runner simulates posts.
- **Publish** — once connected, the job runner posts real LinkedIn updates; not-
  yet-implemented platforms (Meta/YouTube/TikTok/X) still simulate.

## AI setup (Content Studio)
The Content Studio works in two modes:
- **Demo mode (default)** — with NO provider key set, generations return
  realistic, on-brand sample output and a banner notes that it's demo mode. The
  build/preview stay green with no secrets.
- **Live mode** — set `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY` (server-only,
  never `NEXT_PUBLIC_`). Optionally pin the provider with `AI_DEFAULT_PROVIDER`
  (`openai` | `anthropic`; defaults to whichever key exists, Anthropic preferred)
  and the model with `AI_DEFAULT_MODEL`. Keys are read on the server only and
  never reach the client bundle (`import "server-only"`).

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
  placeholders; the runner + simulation already exist) — Phase 3C (LinkedIn),
  3D (Meta), 3G (YouTube/TikTok/X).
- Analytics sync + comment/DM sync into `analytics_snapshots` / `comments_inbox`.
- Finish wiring the remaining list pages from demo fallback to live reads
  (the data layer + actions are ready; dashboard counts are already live).
