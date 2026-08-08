-- Signed agreements. The record of what was actually agreed, kept separate
-- from the deal that produced it: a deal is a forecast and changes constantly,
-- a contract is a fact with a date on it.
create table public.contracts (
  id uuid primary key default gen_random_uuid(),

  -- ON DELETE RESTRICT, not CASCADE. deal_id is NOT NULL so SET NULL is not
  -- available, which leaves the two extremes — and a signed contract is not
  -- something a stray click on a deal should be able to erase. Deleting a deal
  -- that has contracts is refused until they are dealt with explicitly.
  deal_id uuid not null references public.deals (id) on delete restrict,

  -- Denormalised from the deal on purpose: the counterparty on the paper is
  -- who signed, and re-pointing the deal at a different organization later
  -- must not silently rewrite history. SET NULL keeps the contract if the
  -- organization record is removed.
  org_id uuid references public.organizations (id) on delete set null,

  signed_date date not null,

  -- Same fixed scale as deals.value.
  value numeric(14, 2) check (value >= 0),

  notes text,

  created_at timestamptz not null default now()
);

create index contracts_deal_id_idx on public.contracts (deal_id);
create index contracts_org_id_idx on public.contracts (org_id);
