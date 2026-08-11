import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type DealRow, type Result, type StageTransitionRow } from "./types";

const DEAL_SELECT = `
  id, title, value, currency, status, lost_reason, stage_id, expected_close_date,
  stage:pipeline_stages(name, position),
  owner:users(id, name),
  organization:organizations(id, name),
  person:persons(id, name)
`;

type RawDeal = {
  id: string;
  title: string;
  value: string | number | null;
  currency: string | null;
  status: string;
  lost_reason: string | null;
  stage_id: string | null;
  expected_close_date: string | null;
  stage: { name: string; position: number } | null;
  owner: { id: string; name: string } | null;
  organization: { id: string; name: string } | null;
  person: { id: string; name: string } | null;
};

/** numeric(14,2) arrives as a string over the wire — Postgres numerics do not
 *  fit a JS number safely in general, so the driver keeps them exact. These
 *  values are deal amounts, well inside the safe range, so parsing is fine;
 *  doing it here means no screen has to remember. */
function toNumber(value: string | number | null): number | null {
  if (value === null) return null;
  return typeof value === "number" ? value : Number(value);
}

function toDealRow(row: RawDeal): DealRow {
  return {
    id: row.id,
    title: row.title,
    value: toNumber(row.value),
    currency: row.currency,
    status: row.status as DealRow["status"],
    lostReason: row.lost_reason,
    stageId: row.stage_id,
    stageName: row.stage?.name ?? null,
    stagePosition: row.stage?.position ?? null,
    expectedCloseDate: row.expected_close_date,
    ownerId: row.owner?.id ?? null,
    ownerName: row.owner?.name ?? null,
    organizationId: row.organization?.id ?? null,
    organizationName: row.organization?.name ?? null,
    personId: row.person?.id ?? null,
    personName: row.person?.name ?? null,
  };
}

export async function listDeals(): Promise<Result<DealRow[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .select(DEAL_SELECT)
    .order("expected_close_date", { nullsFirst: false });

  if (error) return fail("listDeals", error.message);

  // Open deals first, closed ones last, and soonest to close at the top of
  // each group — the order the list is actually read in.
  //
  // Sorted here rather than with .order("status"): the column sorts
  // alphabetically, which puts 'lost' above 'open' and lands finished deals
  // at the top of the screen. Ordering by the enum's own declaration order
  // would fix that at the database level, but the enum migration is not
  // applied yet, so this must not depend on it.
  const rank: Record<DealRow["status"], number> = { open: 0, won: 1, lost: 2 };
  const rows = (data as unknown as RawDeal[]).map(toDealRow);
  rows.sort((a, b) => rank[a.status] - rank[b.status]);

  return ok(rows);
}

export type StageOption = { id: string; name: string };

/** For the deal form's stage picker, in board order. */
export async function listStages(): Promise<Result<StageOption[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pipeline_stages")
    .select("id, name")
    .order("position");

  if (error) return fail("listStages", error.message);
  return ok(data);
}

export async function getDeal(id: string): Promise<Result<DealRow | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .select(DEAL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) return fail("getDeal", error.message);
  return ok(data ? toDealRow(data as unknown as RawDeal) : null);
}

type RawStageTransition = {
  id: string;
  occurred_at: string;
  from_stage: { name: string } | null;
  to_stage: { name: string } | null;
  changed_by_user: { name: string } | null;
};

/** A deal's move history for its "Stage history" card — newest first, since
 *  that is the one someone just made and wants to confirm landed. Two FKs
 *  from this table point at pipeline_stages (from_stage_id, to_stage_id), so
 *  each embed names its own constraint — PostgREST can't otherwise tell
 *  which one a bare `pipeline_stages(...)` should follow. */
export async function listStageTransitions(dealId: string): Promise<Result<StageTransitionRow[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stage_transitions")
    .select(
      `
      id, occurred_at,
      from_stage:pipeline_stages!stage_transitions_from_stage_id_fkey(name),
      to_stage:pipeline_stages!stage_transitions_to_stage_id_fkey(name),
      changed_by_user:users!stage_transitions_changed_by_fkey(name)
    `,
    )
    .eq("deal_id", dealId)
    .order("occurred_at", { ascending: false });

  if (error) return fail("listStageTransitions", error.message);

  return ok(
    (data as unknown as RawStageTransition[]).map((row) => ({
      id: row.id,
      fromStageName: row.from_stage?.name ?? null,
      toStageName: row.to_stage?.name ?? "—",
      changedByName: row.changed_by_user?.name ?? null,
      occurredAt: row.occurred_at,
    })),
  );
}
