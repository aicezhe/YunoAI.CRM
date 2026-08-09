-- Calls, meetings and to-dos. One table covers both "this happened" (no
-- due_at, done straight away) and "this is owed" (due_at set, done false) —
-- they carry the same fields and users move between the two constantly.
create table public.activities (
  id uuid primary key default gen_random_uuid(),

  -- public.activity_type — see 0001. A closed set the UI maps to an icon and a
  -- filter; as an enum those five values are discoverable from the catalogue
  -- instead of being restated in the client.
  type public.activity_type not null,

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

  created_at timestamptz not null default now(),

  -- An activity must hang off something — but which something is not fixed.
  --
  -- person_id cannot be the mandatory one. Activity is routinely recorded
  -- before the contact exists in the CRM: a call from a company's main line,
  -- a mail to info@, a meeting with a group where no single person is the
  -- counterparty, a note against the deal itself. Requiring a person would
  -- force one of two bad outcomes — the record is not written at all, or a
  -- placeholder contact is invented to satisfy the column, which then has to
  -- be cleaned up later and pollutes every count of real people.
  --
  -- Nor can an activity float free of everything: unattached, it never appears
  -- on any deal, person or organization page, so it is written once and never
  -- read again.
  --
  -- Hence the weakest rule that still guarantees reachability — at least one
  -- link, any of the three, all three still nullable.
  --
  -- Note how this meets the SET NULL above, which is the opposite choice from
  -- deals. Deleting an organization nulls org_id here; if that was the
  -- activity's only link, this constraint rejects it and the delete fails.
  -- So the delete is refused conditionally — only when it would strand a row —
  -- whereas deals uses RESTRICT and refuses unconditionally.
  --
  -- The asymmetry is deliberate. A deal without a counterparty is not a deal,
  -- so failing early with the clearer error is worth the strictness. An
  -- activity usually has more than one link, and blanket RESTRICT would make
  -- organizations undeletable the moment anyone logged a call against them.
  -- The price is the vaguer error in the rare stranding case: it names this
  -- constraint rather than the foreign key.
  constraint activities_has_link check (
    deal_id is not null or person_id is not null or org_id is not null
  )
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
