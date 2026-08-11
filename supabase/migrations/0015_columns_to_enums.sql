-- Converts the four text columns to the enum types created in 0014, and
-- rebuilds everything that had to be taken down to do it.
--
-- Every existing value was verified valid against its target type before
-- this was written, so the `using` casts below cannot fail on current data.
--
-- Three things block a bare `alter column ... type`, and each is handled
-- explicitly rather than discovered at deploy time:
--
--   1. A CHECK comparing the column to text literals. Once the column is an
--      enum the constraint is both redundant (the type enforces the domain)
--      and a liability, so these are dropped rather than recreated.
--
--   2. A column DEFAULT of type text. Postgres will not re-cast a default
--      through a type change, so it is dropped first and re-added afterwards
--      in the new type.
--
--   3. An RLS policy referencing the column. Postgres refuses outright:
--      "cannot alter type of a column used in a policy definition". The
--      policy is dropped and recreated verbatim around the change.

-- ---------------------------------------------------------------- users.role
-- users_update_own_name (0012) reads role in its WITH CHECK, which pins the
-- policy to the column and blocks the conversion. Dropped here, recreated
-- unchanged at the end of this file — the expression only ever compares role
-- against its own stored value, so it behaves identically once role is an
-- enum on both sides.
drop policy if exists users_update_own_name on public.users;

alter table public.users drop constraint if exists users_role_check;

alter table public.users
  alter column role type public.user_role using role::public.user_role;

-- -------------------------------------------------------------- deals.status
alter table public.deals drop constraint if exists deals_status_check;

-- deals_lost_reason_required compares status against a text literal, so it
-- cannot survive the type change either. It is recreated below in the
-- two-way form the review asked for — the live version only enforced half
-- the rule (see the block after the conversion).
alter table public.deals drop constraint if exists deals_lost_reason_required;

alter table public.deals alter column status drop default;

alter table public.deals
  alter column status type public.deal_status using status::public.deal_status;

alter table public.deals alter column status set default 'open';

-- lost_reason belongs to exactly the lost deals, enforced in both
-- directions. The version that was live only had the forward half
-- (`status <> 'lost' or lost_reason is not null`), which let a deal reopened
-- from 'lost' keep its old reason — a row saying two contradictory things,
-- with the stale text invisible in the UI until the deal is lost again and
-- it resurfaces as an explanation for a different loss.
--
-- The emptiness test is trim(), not just NULL: '' and '   ' would satisfy
-- `is not null` and defeat the constraint.
-- Dropped first so the file replays: 0006_deals.sql already declares this
-- constraint under the same name, and `add constraint` on an existing name
-- is an error rather than a no-op.
alter table public.deals drop constraint if exists deals_lost_reason_matches_status;

alter table public.deals
  add constraint deals_lost_reason_matches_status check (
    case
      when status = 'lost' then lost_reason is not null and length(trim(lost_reason)) > 0
      else lost_reason is null
    end
  );

-- ---------------------------------------------------------- activities.type
alter table public.activities drop constraint if exists activities_type_check;

alter table public.activities
  alter column type type public.activity_type using type::public.activity_type;

-- ------------------------------------------------------ activities.priority
alter table public.activities drop constraint if exists activities_priority_check;

alter table public.activities alter column priority drop default;

alter table public.activities
  alter column priority type public.activity_priority using priority::public.activity_priority;

alter table public.activities alter column priority set default 'normal';

-- --------------------------------------------------------- policy, restored
-- Verbatim from 0012 — see that file for why WITH CHECK pins role and email
-- to their stored values rather than simply allowing the update.
create policy users_update_own_name on public.users
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and role = (select role from public.users where id = (select auth.uid()))
    and email = (select email from public.users where id = (select auth.uid()))
  );
