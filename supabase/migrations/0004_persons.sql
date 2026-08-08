-- Contacts. A person usually belongs to an organization, but not always —
-- an individual buyer or an unattached lead is a normal record here.
create table public.persons (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  -- ON DELETE SET NULL, not CASCADE: deleting a company must not silently
  -- delete the people you know there. They survive as unattached contacts and
  -- can be re-linked. Nullable already, so the demotion is representable.
  org_id uuid references public.organizations (id) on delete set null,

  email text,
  phone text,

  -- Same reasoning as organizations.owner_id.
  owner_id uuid references public.users (id) on delete set null,

  created_at timestamptz not null default now()
);

-- Drives the contact list on an organization's page.
create index persons_org_id_idx on public.persons (org_id);
create index persons_owner_id_idx on public.persons (owner_id);
