-- The "an activity must be attached to something" rule from schema review,
-- plus the cleanup that makes it possible to enforce.
--
-- THE CONFLICT THIS RESOLVES
--
-- activities_has_link has been written in the repo since the review and was
-- never applied, because on its own it contradicts the foreign keys already
-- in place. activities.person_id and activities.org_id are both ON DELETE
-- SET NULL — deliberately, so deleting a company does not delete the calls
-- you logged with the people there. But an activity whose *only* link was
-- the deleted record has all three columns set to NULL by that cascade, and
-- the CHECK then rejects the delete. The constraint and the cascade cannot
-- both hold unless something removes those rows first.
--
-- Decision taken: delete the orphans. An activity that has lost its last
-- link is unreachable from every screen in the app — it belongs to no deal,
-- no contact and no company — so keeping it means accumulating rows nobody
-- can find. Activities that still have another link are untouched and keep
-- their history, which is the case the SET NULL was protecting.
--
-- BEFORE DELETE, not AFTER: the trigger has to run while the activity rows
-- still carry the id being deleted. By the time an AFTER trigger fires the
-- FK cascade has already nulled them and they are indistinguishable from
-- activities that were never linked to anything.
--
-- SECURITY DEFINER with an empty search_path, matching handle_new_auth_user
-- and is_admin: the cleanup must be complete regardless of what the caller
-- can see through RLS. Leaving one orphan behind because the deleting user
-- could not read that row would abort their delete with a constraint error
-- they have no way to act on.

create or replace function public.delete_orphaned_person_activities()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  delete from public.activities
  where person_id = old.id
    and deal_id is null
    and org_id is null;
  return old;
end;
$fn$;

create or replace function public.delete_orphaned_org_activities()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  delete from public.activities
  where org_id = old.id
    and deal_id is null
    and person_id is null;
  return old;
end;
$fn$;

drop trigger if exists persons_delete_orphaned_activities on public.persons;
create trigger persons_delete_orphaned_activities
  before delete on public.persons
  for each row
  execute function public.delete_orphaned_person_activities();

drop trigger if exists organizations_delete_orphaned_activities on public.organizations;
create trigger organizations_delete_orphaned_activities
  before delete on public.organizations
  for each row
  execute function public.delete_orphaned_org_activities();

-- Any pre-existing orphans would block the constraint below. There are none
-- on this database (checked before writing), but a database restored from an
-- older dump could have them, and failing here with a bare constraint
-- violation would be an unhelpful way to find out.
delete from public.activities
where deal_id is null and person_id is null and org_id is null;

-- The rule itself. Any one link is enough — the schema comment's own
-- reasoning: a call to a company's main line has no person to attach, and a
-- note on a deal has neither a person nor a company of its own.
alter table public.activities
  add constraint activities_has_link check (
    deal_id is not null or person_id is not null or org_id is not null
  );
