-- Who ticked an activity off, and when.
--
-- `done` said that work finished but not who finished it, which is the
-- question the archive actually raises: a call marked done by somebody else
-- means something different from one you closed yourself, and until now the
-- archive could not tell the two apart.
--
-- Deliberately separate from created_by. Logging a task and completing it
-- are different acts by potentially different people — the whole point of a
-- shared list is that Marco can close what Anna wrote down.
--
-- SET NULL rather than RESTRICT: a teammate leaving should not pin an
-- activity's history in place. The record keeps "finished on the 12th", it
-- just stops naming somebody who no longer exists — the same trade
-- deals.owner_id already makes.
alter table public.activities
  add column completed_by uuid references public.users (id) on delete set null,
  add column completed_at timestamptz;

-- One direction only: an activity that is *not* done cannot claim a
-- completer. The other direction is deliberately unchecked — rows finished
-- before this migration are done with both columns null, and rejecting them
-- would mean either inventing a name for work nobody recorded, or refusing
-- to accept the history that already exists.
alter table public.activities
  add constraint activities_completion_matches_done check (
    done or (completed_by is null and completed_at is null)
  );

comment on column public.activities.completed_by is
  'Who ticked it off — set by setActivityDone, cleared when it is unticked. Null on rows completed before 0021.';
