-- Lets a signed-in user edit their own display name — the self-service
-- profile editing that 0010_rls.sql's comment on users_write_admin flagged
-- as needing its own rule rather than being improvised later. This is that
-- rule, arriving now that Settings actually has a form for it.
--
-- Written against the schema currently live on this project: role here is
-- plain text, not the public.user_role enum 0001_enums.sql defines — that
-- migration (and the renumbered set after it, responding to schema review)
-- was never applied to this database, only written to the repo. Noted here
-- so this file isn't read as evidence the enum exists; the policy below
-- works identically either way, since it only compares role against its own
-- stored value rather than against any particular type.
--
-- The WITH CHECK pins role and email to whatever is already stored for that
-- row, so the one thing this policy actually opens up is name. A request
-- that tries to change role or email alongside name is rejected outright —
-- not silently narrowed to just the name part — which is what stops a
-- member from promoting themselves by riding along on their own profile
-- edit. Combined with the existing users_write_admin policy (still the only
-- way to change someone else's row, or your own role): Postgres evaluates
-- multiple permissive policies for the same command with OR, so an admin's
-- unrestricted write and a member's name-only self-write coexist without
-- either policy needing to know about the other.
create policy users_update_own_name on public.users
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and role = (select role from public.users where id = (select auth.uid()))
    and email = (select email from public.users where id = (select auth.uid()))
  );
