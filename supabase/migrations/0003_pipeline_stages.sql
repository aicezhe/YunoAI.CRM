-- The ordered columns of the pipeline. A lookup table, edited rarely and by
-- hand — every deal points at exactly one row here.
create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),

  name text not null unique,

  -- Sort order for the board. Unique because two stages sharing a position
  -- makes the order depend on whatever the planner returns that day, and the
  -- board would silently reshuffle between page loads.
  --
  -- Note the practical cost: reordering stages has to move positions around a
  -- free slot (or defer the constraint), it cannot just swap two numbers in
  -- one statement. That is the intended trade — a stable board is worth more
  -- than a convenient reorder, which happens almost never.
  position integer not null unique check (position >= 0),

  created_at timestamptz not null default now()
);

comment on table public.pipeline_stages is
  'Ordered pipeline columns. Referenced by deals and stage_transitions with ON DELETE RESTRICT.';
