-- Priority on an activity, so the urgent ones can be picked out of a list
-- that is otherwise ordered only by when something is due.
--
-- Two values, not a 1-5 scale: the question this answers is "does this jump
-- the queue or not", and a scale invites arguing about whether something is
-- a 3 or a 4 without changing what anyone does about it.
--
-- text + CHECK rather than a Postgres enum type, matching every other
-- constrained column in this schema (activities.type, deals.status,
-- users.role are all text + CHECK — there are no enum types in this
-- database). A real enum would also make adding a value later a DDL
-- migration on a type other tables could come to depend on, where a CHECK is
-- edited in place.
--
-- NOT NULL DEFAULT 'normal' so every existing row is backfilled by the ALTER
-- itself and no application code has to treat the column as optional.
alter table public.activities
  add column priority text not null default 'normal'
    check (priority in ('normal', 'urgent'));

comment on column public.activities.priority is
  'normal | urgent. Urgent activities sort above the rest in the open list.';

-- The open list reads "not done, urgent first, then by due date". The
-- existing activities_open_due_at_idx covers the due_at half; this one lets
-- the same partial scan pick up priority without a separate lookup.
create index activities_open_priority_due_at_idx
  on public.activities (priority, due_at)
  where done = false;
