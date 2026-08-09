-- Companies. The root record most other things hang off.
create table public.organizations (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  website text,
  industry text,
  address text,

  -- The sales rep responsible. ON DELETE SET NULL: when someone leaves the
  -- team their account goes, but their accounts must not go with it — the
  -- organization becomes unassigned and shows up for reassignment.
  owner_id uuid references public.users (id) on delete set null,

  created_at timestamptz not null default now()
);

-- "My organizations" is the default filter on the list screen, so this is the
-- access path that actually runs, not a speculative index.
create index organizations_owner_id_idx on public.organizations (owner_id);
