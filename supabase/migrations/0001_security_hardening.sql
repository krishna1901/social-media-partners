-- ============================================================================
-- Security hardening migration — APPLY TO THE LIVE PROJECT.
--
-- This mirrors the "Phase 8 — security hardening" block in supabase/schema.sql.
-- It is required on the running database because the app connects to live
-- Supabase with the public anon key, so the privilege-escalation fix (#1) must
-- exist on the DB to take effect — app code alone cannot enforce it.
--
-- Apply via the Supabase SQL editor or CLI:
--   supabase db execute -f supabase/migrations/0001_security_hardening.sql
-- Idempotent + additive (safe to re-run).
-- ============================================================================

-- #1 (CRITICAL) — Block self-mutation of privileged profile columns.
-- Without this, any authenticated user can run, via the public anon key,
--   update public.profiles set role='super_admin' where id = <self>
-- to seize the full /admin surface, or set status='active' to un-suspend.
create or replace function public.profiles_guard_privileged_cols()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service-role (admin) writes have auth.uid() = null and are allowed.
  if auth.uid() is not null
     and (new.role is distinct from old.role
          or new.status is distinct from old.status) then
    raise exception 'role/status may only be changed by an administrator'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_guard_privileged on public.profiles;
create trigger profiles_guard_privileged
  before update on public.profiles
  for each row execute function public.profiles_guard_privileged_cols();
revoke update (role, status) on public.profiles from anon, authenticated;

-- #2 — One bootstrap workspace per owner (collapses concurrent first-login
-- bootstraps). Conditional so it never fails / deletes data when legacy
-- duplicate owners exist — de-duplicate those first, then re-run.
do $$
begin
  if not exists (
    select 1 from public.workspaces where owner_id is not null
    group by owner_id having count(*) > 1
  ) then
    create unique index if not exists uq_workspaces_owner
      on public.workspaces (owner_id) where owner_id is not null;
  else
    raise notice 'uq_workspaces_owner skipped: duplicate owner_id rows exist; de-duplicate first.';
  end if;
end $$;

-- #3 — Suspended-user RLS backstop: workspace-scoped policies also require an
-- active profile (defense-in-depth; requireLiveContext() already gates in code).
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active'
  );
$$;
revoke execute on function public.is_active_user() from anon;

do $$
declare
  t text;
  tables text[] := array[
    'posts','post_channels','media_assets','scheduled_posts','publishing_jobs',
    'publishing_logs','connected_accounts','social_tokens','platform_permissions',
    'trends','content_ideas','ai_generations','analytics_snapshots',
    'comments_inbox','dm_automations','competitors','competitor_posts','settings',
    'automation_logs'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists "%s_member_all" on public.%I;', t, t);
    execute format(
      'create policy "%s_member_all" on public.%I
         for all
         using (public.is_active_user() and public.is_workspace_member(workspace_id))
         with check (public.is_active_user() and public.is_workspace_member(workspace_id));', t, t);
  end loop;
end;
$$;
