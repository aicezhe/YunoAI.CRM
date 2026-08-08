-- Opportunities. The centre of the model: everything else is either a
-- counterparty on a deal, a record of it moving, or its paperwork.
create table public.deals (
  id uuid primary key default gen_random_uuid(),

  title text not null,

  -- ON DELETE RESTRICT on both counterparties, and this is the one FK rule
  -- worth reading twice.
  --
  -- SET NULL would be the obvious choice, and it is wrong here: it collides
  -- with deals_has_counterparty below. A deal linked only to an organization
  -- would have org_id set to null by the delete, the CHECK would then fail,
  -- and the whole DELETE would abort — RESTRICT's behaviour, reached through
  -- a constraint-violation error that names the wrong constraint. RESTRICT
  -- says the same thing directly: detach the deal first, then delete.
  org_id uuid references public.organizations (id) on delete restrict,
  person_id uuid references public.persons (id) on delete restrict,

  -- Rep responsible. SET NULL as everywhere else — see organizations.
  owner_id uuid references public.users (id) on delete set null,

  -- Money, so a fixed scale rather than bare numeric: 2 decimal places, up to
  -- 12 integer digits. Unconstrained numeric would happily store 1/3 as
  -- 0.3333… and print a different total than the one that was entered.
  value numeric(14, 2) check (value >= 0),

  -- ISO 4217. Stored per deal because a pipeline can mix currencies; the
  -- CHECK only guarantees the shape, not that the code exists.
  currency text default 'EUR' check (currency ~ '^[A-Z]{3}$'),

  -- ON DELETE RESTRICT: a stage with live deals cannot be deleted. Emptying
  -- or merging the stage first is a deliberate act; cascading would delete
  -- real pipeline, and SET NULL would leave deals in no column at all.
  stage_id uuid references public.pipeline_stages (id) on delete restrict,

  status text not null default 'open' check (status in ('open', 'won', 'lost')),

  lost_reason text,

  expected_close_date date,

  created_at timestamptz not null default now(),

  -- A lost deal must say why. This is the field that makes the loss report
  -- worth anything, and it is exactly the field people skip when the form is
  -- the only thing asking.
  --
  -- Only the 'lost' direction is enforced: a leftover reason on a deal that
  -- was reopened is untidy but harmless, whereas forbidding it would make
  -- reopening fail unless the form also clears the field in the same update.
  constraint deals_lost_reason_required check (
    status <> 'lost' or (lost_reason is not null and length(trim(lost_reason)) > 0)
  ),

  -- A deal has to be with someone. Either end is enough — an opportunity at a
  -- company with no named contact yet is real, and so is one with an
  -- individual who has no company.
  constraint deals_has_counterparty check (
    org_id is not null or person_id is not null
  )
);

-- The board groups by stage; the list filters by owner. Both run on every
-- visit to the deals screen.
create index deals_stage_id_idx on public.deals (stage_id);
create index deals_owner_id_idx on public.deals (owner_id);

-- Opening an organization or a person shows their deals.
create index deals_org_id_idx on public.deals (org_id);
create index deals_person_id_idx on public.deals (person_id);
