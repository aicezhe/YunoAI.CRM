-- The enum types from schema review, declared for real this time.
--
-- WHY THIS FILE EXISTS AT 0014 RATHER THAN 0001
--
-- 0001_enums.sql has been in the repo since the review and has never run.
-- This database was migrated from the pre-review file set, where 0001 was
-- `users`, 0002 `pipeline_stages`, and so on. The review inserted an enums
-- file at the front and renumbered everything after it by one — but
-- supabase_migrations.schema_migrations was already populated with versions
-- 0001..0010, and `db push` compares the version number alone, not the file
-- name or its contents. So every renumbered file was read as "already
-- applied" and skipped, permanently.
--
-- Repairing the ledger so those files re-run is not an option: they contain
-- `create table`, and the tables exist. The only correct direction is
-- forward, which is what 0014-0017 do — they carry the review's intent to a
-- database that was built before it.
--
-- The reasoning for enums over text+CHECK is unchanged from 0001_enums.sql:
-- a CHECK is opaque to everything except the planner, while an enum is a
-- catalogue type that PostgREST, type generators and GUI clients can all
-- introspect, so the allowed values stop being duplicated in application
-- code. The cost, stated plainly: adding a value is cheap and online
-- (`alter type ... add value`), removing or renaming one is not.
--
-- Sort order is declaration order, not alphabetical: 'open' < 'won' < 'lost'
-- rather than lost/open/won. Worth knowing before ordering a report by it.

-- Guarded, because 0001_enums.sql declares the same three types. On this
-- database 0001 never ran (see above) so these create them for the first
-- time; on a database built from the repo as it now stands, 0001 ran and
-- these are no-ops. Without the guard the whole set is unreplayable: a
-- reviewer pointing `supabase db push` at a fresh Supabase project would
-- fail here with `type "user_role" already exists`.
do $enums$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'member');
  end if;

  if not exists (select 1 from pg_type where typname = 'deal_status') then
    create type public.deal_status as enum ('open', 'won', 'lost');
  end if;

  -- Ordered roughly by how a rep works: live contact first, then written,
  -- then the two that carry no counterparty of their own.
  if not exists (select 1 from pg_type where typname = 'activity_type') then
    create type public.activity_type as enum ('call', 'meeting', 'email', 'task', 'note');
  end if;
end
$enums$;

-- Not in 0001_enums.sql: priority was added later, in 0013, and matched the
-- text+CHECK convention that was actually live at the time. It joins the
-- others here so the rule is uniform rather than "enums except this one".
-- Guarded for symmetry with the block above, not because 0001 declares it.
do $priority$
begin
  if not exists (select 1 from pg_type where typname = 'activity_priority') then
    create type public.activity_priority as enum ('normal', 'urgent');
  end if;
end
$priority$;
