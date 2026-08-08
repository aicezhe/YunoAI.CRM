-- Append-only history of a deal moving between stages. Written by the app on
-- every stage change; nothing here is edited afterwards.
create table public.stage_transitions (
  id uuid primary key default gen_random_uuid(),

  -- ON DELETE CASCADE: the history describes one deal and means nothing
  -- without it. Deleting a deal takes its trail with it — the only place in
  -- this schema where a delete is allowed to remove other rows.
  deal_id uuid not null references public.deals (id) on delete cascade,

  -- Null for the very first transition: the deal entered the pipeline, it did
  -- not come from anywhere.
  from_stage_id uuid references public.pipeline_stages (id) on delete restrict,
  to_stage_id uuid not null references public.pipeline_stages (id) on delete restrict,

  -- Who moved it. SET NULL so history outlives the person — the move still
  -- happened after they left, it just no longer names them.
  changed_by uuid references public.users (id) on delete set null,

  occurred_at timestamptz not null default now(),

  -- A transition from a stage to itself is not a move; it is a double-click
  -- or a retried request, and it would put a meaningless row in the timeline
  -- and skew any "time in stage" figure computed from these rows.
  constraint stage_transitions_actually_moved check (from_stage_id is distinct from to_stage_id)
);

-- The deal timeline reads this ordered by time, newest first.
create index stage_transitions_deal_id_occurred_at_idx
  on public.stage_transitions (deal_id, occurred_at desc);
