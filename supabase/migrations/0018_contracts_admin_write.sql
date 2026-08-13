-- Editing a signed contract becomes admin-only. Recording and reading stay
-- open to everyone.
--
-- The reasoning, since this is the app's first permission drawn between the
-- roles outside of Settings: deals and contacts are working data — they are
-- *supposed* to be rewritten all day, by anyone. A contract is the record of
-- a signed fact, and its value is the number any revenue figure would be
-- reconciled against. Facts do get entered wrong, so there has to be a way
-- to correct one — but a correction to bookkeeping is an accountable act,
-- which is what the admin role is. A member who spots a wrong amount asks;
-- an admin fixes and answers for it.
--
-- Anyone may still *create* a contract: recording what was signed is part of
-- closing a deal, and gating it would put an admin in the middle of every
-- win. The asymmetry is deliberate — append freely, rewrite accountably.
--
-- DELETE is gated with UPDATE. It would be incoherent to require the admin
-- role for changing a number but let anyone erase the whole record; no UI
-- deletes contracts today, so this closes a door nothing was using.
--
-- is_admin() is the SECURITY DEFINER helper from 0010 — the same one the
-- users policies already trust.

drop policy if exists contracts_all_authenticated on public.contracts;

create policy contracts_select_authenticated on public.contracts
  for select to authenticated using (true);

create policy contracts_insert_authenticated on public.contracts
  for insert to authenticated with check (true);

create policy contracts_update_admin on public.contracts
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy contracts_delete_admin on public.contracts
  for delete to authenticated using (public.is_admin());
