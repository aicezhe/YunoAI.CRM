-- The default pipeline.
--
-- Seeded as a migration rather than from supabase/seed.sql because seed.sql
-- only runs on a local `db reset` — a remote project gets migrations and
-- nothing else. Stages are reference data the app cannot function without
-- (every deal needs a stage), so they ship with the schema.
--
-- ON CONFLICT DO NOTHING makes re-running harmless and, more to the point,
-- means this never overwrites stages the team has since renamed or reordered.
--
-- Positions are spaced by 10, not 1: inserting a stage between two existing
-- ones then needs no rewrite of everything after it, which matters because
-- pipeline_stages.position is UNIQUE and a shift-everything-down update would
-- collide partway through.
--
-- Note that Won and Lost appear both here and in deals.status. They are not
-- duplicates: status is the fact, these are the board columns closed deals are
-- parked in. The app sets both together when a deal closes.
insert into public.pipeline_stages (name, position) values
  ('Lead', 0),
  ('Qualified', 10),
  ('Demo', 20),
  ('Proposal', 30),
  ('Negotiation', 40),
  ('Won', 50),
  ('Lost', 60)
on conflict do nothing;
