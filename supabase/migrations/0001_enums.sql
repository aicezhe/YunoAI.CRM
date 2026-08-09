-- Enumerated types, declared before any table that uses them.
--
-- These were text columns with a CHECK constraint. Both forms reject bad
-- values; the difference is what the rest of the system can see. A CHECK is
-- opaque — it is a boolean expression the planner evaluates and nothing else
-- can read. An enum is a type in the catalogue, so every client that
-- introspects the database (PostgREST's generated schema, type generators,
-- an ORM, a GUI's dropdown) discovers the allowed values instead of having
-- them hardcoded a second time in application code.
--
-- The trade to state plainly at review: adding a value is cheap and online
-- (`alter type ... add value`), but removing or renaming one is not — there
-- is no `drop value`, and the type has to be recreated and every column
-- rewritten. So an enum suits a set that grows and settles, which is what
-- these three are. A set that churns belongs in a lookup table instead —
-- which is exactly why pipeline stages are a table, not an enum: they are
-- configuration the team reorders, and they carry a position and an id that
-- other rows point at.
--
-- Sort order is declaration order, not alphabetical: 'open' < 'won' < 'lost'
-- rather than lost/open/won. Worth knowing before ordering a report by status.

create type public.user_role as enum ('admin', 'member');

create type public.deal_status as enum ('open', 'won', 'lost');

-- Ordered roughly by how a rep works: live contact first, then written, then
-- the two that carry no counterparty of their own.
create type public.activity_type as enum ('call', 'meeting', 'email', 'task', 'note');
