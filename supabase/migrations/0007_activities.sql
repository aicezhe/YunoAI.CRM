-- Calls, meetings and to-dos. One table covers both "this happened" (no
-- due_at, done straight away) and "this is owed" (due_at set, done false) —
-- they carry the same fields and users move between the two constantly.
create table public.activities (
  id uuid primary key default gen_random_uuid(),

  -- Closed set so the UI can map each kind to an icon and a filter without a
  -- lookup table. Extending it is one ALTER; typos never enter at all.
  type text not null check (type in ('call', 'meeting', 'email', 'task', 'note')),

  subject text not null,
  description text,

  -- All three parents are ON DELETE SET NULL, including deal_id — deliberately
  -- unlike stage_transitions, which cascades.
  --
  -- A transition exists only as part of one deal. An activity does not: the
  -- same call can be attached to a person and an organization as well, and
  -- deleting the deal must not erase the fact that the call happened. The
  -- column is nullable, so detaching is representable; cascading would take
  -- the person's history with the deal.
  deal_id uuid references public.deals (id) on delete set null,
  person_id uuid references public.persons (id) on delete set null,
  org_id uuid references public.organizations (id) on delete set null,

  -- Null means "already happened, nothing owed" — a logged note or a call
  -- recorded after the fact. Non-null makes it a task.
  due_at timestamptz,

  done boolean not null default false,

  created_by uuid references public.users (id) on delete set null,

  created_at timestamptz not null default now()
);

-- The activity feed on a deal page.
create index activities_deal_id_idx on public.activities (deal_id);

-- The task list: open items, soonest first. Partial on done = false because
-- that is the only slice the list ever reads, and completed activities are
-- the ones that accumulate forever — keeping them out holds the index at the
-- size of the backlog rather than the size of all history.
--
-- Consequence worth knowing: a query over due_at that does NOT filter on
-- done = false cannot use this index.
create index activities_open_due_at_idx
  on public.activities (due_at)
  where done = false;

create index activities_person_id_idx on public.activities (person_id);
create index activities_org_id_idx on public.activities (org_id);
