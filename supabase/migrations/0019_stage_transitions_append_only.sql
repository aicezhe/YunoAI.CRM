-- stage_transitions becomes append-only at the database level.
--
-- The table has been described as append-only since 0007, but only the
-- application respected that: the policy was a single FOR ALL with
-- `using (true) with check (true)`, so any authenticated caller could
-- UPDATE or DELETE a row — through PostgREST with the publishable key, or
-- by hand in the Dashboard. Verified before writing this: as an ordinary
-- member, `update stage_transitions set occurred_at = '2020-01-01'` and
-- `delete from stage_transitions` both reported one row affected.
--
-- That matters because this log is evidence. When a deal entered Won is
-- what "how long do deals sit in Proposal" is measured from, and what
-- commission gets argued over. A record that can be edited by the person it
-- pays is not a record.
--
-- Two layers, because neither is sufficient alone:
--
--   1. Policies. SELECT and INSERT stay open to authenticated; UPDATE and
--      DELETE get no policy at all, and RLS denies whatever it has no
--      policy for. service_role is unaffected — it bypasses RLS by
--      design, which is what keeps migrations and admin tooling working.
--
--   2. Grants. RLS only ever runs on top of a privilege the role already
--      has, so the UPDATE/DELETE grants are revoked too. This is not
--      belt-and-braces: TRUNCATE is *not subject to RLS at all*, so with
--      the grant in place a single statement could empty the whole history
--      no matter what the policies say. Revoking is the only thing that
--      closes it.
--
-- Deleting a deal still removes its history: stage_transitions.deal_id is
-- ON DELETE CASCADE, and a foreign-key cascade is performed by the system,
-- not by the calling role — it passes through neither the DELETE policy nor
-- the revoked grant. Checked live rather than assumed; see the migration
-- note in the commit.

drop policy if exists stage_transitions_all_authenticated on public.stage_transitions;

-- The history is meant to be read — the deal page renders it.
create policy stage_transitions_select_authenticated on public.stage_transitions
  for select to authenticated using (true);

-- Appending is the one write anyone makes, and only ever as a side effect of
-- moving a deal (see logStageTransition).
create policy stage_transitions_insert_authenticated on public.stage_transitions
  for insert to authenticated with check (true);

-- Deliberately no UPDATE and no DELETE policy: absence is the denial.

revoke update, delete, truncate on public.stage_transitions from authenticated, anon;

comment on table public.stage_transitions is
  'Append-only history of deal stage changes. INSERT and SELECT only for authenticated; UPDATE/DELETE/TRUNCATE revoked (0019). Rows disappear only with their deal, via ON DELETE CASCADE.';
