-- Deleting a deal becomes admin-only.
--
-- Everything else about a deal stays open to every signed-in member:
-- creating, editing, moving through stages, closing as Won or Lost. Closing
-- as Lost *is* the way a deal that went nowhere is recorded — and it keeps
-- the stage history, the activities and the reason. Deleting is the one
-- operation that destroys evidence rather than recording an outcome, and
-- it takes the history with it: stage_transitions.deal_id is ON DELETE
-- CASCADE, so the append-only log 0019 just protected disappears silently
-- along with the row that referenced it.
--
-- The app has no delete path for deals at all — no action, no button. So
-- this closes the only route that exists: a direct PostgREST call with the
-- publishable key, or a hand-written statement. Everything below is the
-- database refusing on its own, with nothing in front of it to rely on.
--
-- The FOR ALL policy is replaced by one policy per command rather than
-- narrowed: a single policy cannot say "true for these three verbs and
-- is_admin() for that one".
--
-- TRUNCATE is revoked for the same reason as on stage_transitions (0019):
-- it is not subject to RLS at all, so a DELETE policy without this revoke
-- would be a guarantee in name only — one statement would empty the table
-- and cascade the whole history away with it. The DELETE *grant* stays, so
-- that admins can still delete; the policy decides who.

drop policy if exists deals_all_authenticated on public.deals;

create policy deals_select_authenticated on public.deals
  for select to authenticated using (true);

create policy deals_insert_authenticated on public.deals
  for insert to authenticated with check (true);

create policy deals_update_authenticated on public.deals
  for update to authenticated using (true) with check (true);

-- The one narrowing. is_admin() is the SECURITY DEFINER helper from 0010,
-- already trusted by the users and pipeline_stages policies.
create policy deals_delete_admin on public.deals
  for delete to authenticated using (public.is_admin());

revoke truncate on public.deals from authenticated, anon;

comment on table public.deals is
  'Opportunities. Read/created/edited by any signed-in member; deleting is admin-only (0020), because it destroys the stage history with it. A deal that went nowhere is closed as Lost, not deleted.';
