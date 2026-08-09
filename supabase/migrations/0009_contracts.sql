-- Signed agreements. The record of what was actually agreed, kept separate
-- from the deal that produced it: a deal is a forecast and changes constantly,
-- a contract is a fact with a date on it.
create table public.contracts (
  id uuid primary key default gen_random_uuid(),

  -- ON DELETE RESTRICT, not CASCADE. deal_id is NOT NULL so SET NULL is not
  -- available, which leaves the two extremes — and a signed contract is not
  -- something a stray click on a deal should be able to erase. Deleting a deal
  -- that has contracts is refused until they are dealt with explicitly.
  -- The only link to a counterparty. The organization is reached through
  -- deals.org_id, one join away.
  --
  -- An earlier draft also carried org_id here, denormalised, so a contract
  -- would keep naming the company that signed even if the deal were later
  -- re-pointed. Dropped in review, and rightly: two columns holding the same
  -- fact drift, nothing here keeps them equal, and a contract silently naming
  -- a different organization than its own deal is worse than the problem it
  -- was meant to solve. If preserving the signatory against later edits turns
  -- out to matter, the honest fix is to snapshot the name as text at signing
  -- time — a fact frozen on purpose, not a second live foreign key pretending
  -- to be one.
  deal_id uuid not null references public.deals (id) on delete restrict,

  signed_date date not null,

  -- Same fixed scale as deals.value.
  value numeric(14, 2) check (value >= 0),

  notes text,

  created_at timestamptz not null default now()
);

create index contracts_deal_id_idx on public.contracts (deal_id);
