-- Row Level Security.
--
-- Not on the original list, and included because without it the schema is
-- open: the publishable key is designed to be shipped to browsers, and on a
-- table with RLS disabled that key can read and write every row through
-- PostgREST. RLS is what makes the key safe to hold. Remove this file only if
-- something else takes over that job.
--
-- The model is deliberately flat: this is an internal CRM where the whole team
-- sees the whole pipeline. Ownership (owner_id) drives default filters in the
-- UI, not visibility. What admins alone control is configuration and accounts.

-- Reading a role inside a policy on public.users would re-enter that policy
-- and recurse. security definer runs the lookup with RLS bypassed, which
-- breaks the cycle; the empty search_path is the usual hardening so a
-- shadowed name cannot redirect the query.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

alter table public.users enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.organizations enable row level security;
alter table public.persons enable row level security;
alter table public.deals enable row level security;
alter table public.stage_transitions enable row level security;
alter table public.activities enable row level security;
alter table public.contracts enable row level security;

-- users: everyone signed in can read the roster, because owner_id has to
-- render as a name. Writes are admin-only — self-service profile editing can
-- be added later, but it needs a rule that stops a member setting their own
-- role, so it is not something to improvise here.
--
-- The insert done by handle_new_auth_user() is unaffected: that function is
-- security definer and bypasses RLS.
create policy users_select_authenticated on public.users
  for select to authenticated using (true);

create policy users_write_admin on public.users
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- pipeline_stages: configuration. Everyone reads it (the board is built from
-- it), only admins reshape it.
create policy pipeline_stages_select_authenticated on public.pipeline_stages
  for select to authenticated using (true);

create policy pipeline_stages_write_admin on public.pipeline_stages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- The CRM proper: any signed-in member works the whole pipeline.
create policy organizations_all_authenticated on public.organizations
  for all to authenticated using (true) with check (true);

create policy persons_all_authenticated on public.persons
  for all to authenticated using (true) with check (true);

create policy deals_all_authenticated on public.deals
  for all to authenticated using (true) with check (true);

create policy stage_transitions_all_authenticated on public.stage_transitions
  for all to authenticated using (true) with check (true);

create policy activities_all_authenticated on public.activities
  for all to authenticated using (true) with check (true);

create policy contracts_all_authenticated on public.contracts
  for all to authenticated using (true) with check (true);
