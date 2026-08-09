-- App-level profile for a Supabase Auth account: display name and role.
--
-- The primary key IS auth.users.id rather than a fresh uuid. Supabase Auth
-- already owns identity (email, password, confirmation); duplicating it here
-- would leave two ids for one person and a join on email — which changes.
-- Sharing the key means the app looks a profile up by exactly the id the
-- session already carries (see src/lib/auth/profile.ts).
--
-- ON DELETE CASCADE: deleting the auth account removes the profile with it.
-- The alternative leaves a row that can never be signed into again.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,

  -- Mirrored from auth.users for display and for the admin list. Unique so a
  -- second profile can never claim the same address.
  email text not null unique,
  name text not null,

  -- public.user_role, not text + CHECK — see 0001 for why. The role decides
  -- authorization, so a typo ('Admin', 'owner') must fail at write time rather
  -- than silently under-granting at read time. src/lib/auth/roles.ts parses
  -- the same pair.
  role public.user_role not null default 'member',

  created_at timestamptz not null default now()
);

comment on table public.users is
  'App profile for an auth.users account. id is shared with auth.users.';

-- Profiles are created for accounts made in the Supabase Dashboard, which
-- never touches this table. Without the trigger below, a Dashboard-created
-- user signs in fine and then has no name and no role.
--
-- security definer so the function may write to public.users while running as
-- the auth system; the empty search_path stops a shadowed table name from
-- redirecting the insert (standard hardening for definer functions).
create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    -- Name from the sign-up payload when present, else the email's local part
    -- so the UI always has something to show.
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    -- Role is deliberately NOT read from user metadata: users can edit their
    -- own metadata through the Auth API, so trusting it here would let any
    -- account promote itself. Promotion is a separate, admin-only update.
    'member'
  )
  on conflict (id) do nothing;
  return new;
end;
$fn$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
