"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/current-user";

/**
 * Server Actions for deals: creating one, and moving it through the pipeline.
 */

export type DealFormValues = {
  title: string;
  orgId: string;
  personId: string;
  stageId: string;
  value: string;
  expectedCloseDate: string;
  ownerId: string;
};

export type DealFormState = { error: string | null; values: DealFormValues };

/**
 * Validation mirrors 0006_deals.sql: title is NOT NULL, value is CHECKed >=
 * 0, and deals_has_counterparty requires an organization or a person — not
 * necessarily both, and the form enforces exactly that, nothing stricter.
 *
 * status is never a form field: it defaults to 'open' at the database level,
 * and every deal made here starts open by construction. Marking one won or
 * lost is an edit to an existing deal, not something creation needs to
 * express — lost_reason's two-way CHECK only becomes relevant there.
 *
 * stage_id is nullable in the schema, but leaving a deal off the board
 * entirely is not a real workflow this app has, so the form defaults it to
 * the first stage by position rather than leaving it unset — while still
 * allowing "No stage" explicitly, so the schema's own flexibility isn't
 * silently narrowed into a hard requirement.
 */
export async function createDeal(
  _prevState: DealFormState,
  formData: FormData,
): Promise<DealFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const orgId = String(formData.get("orgId") ?? "");
  const personId = String(formData.get("personId") ?? "");
  const stageId = String(formData.get("stageId") ?? "");
  const rawValue = String(formData.get("value") ?? "").trim();
  const expectedCloseDate = String(formData.get("expectedCloseDate") ?? "");
  const ownerId = String(formData.get("ownerId") ?? "");

  const values: DealFormValues = {
    title,
    orgId,
    personId,
    stageId,
    value: rawValue,
    expectedCloseDate,
    ownerId,
  };

  if (!title) return { error: "Enter a title.", values };
  if (!orgId && !personId) return { error: "Choose an organization or a contact.", values };

  let value: number | null = null;
  if (rawValue) {
    value = Number(rawValue);
    if (!Number.isFinite(value) || value < 0) {
      return { error: "Value must be a positive number.", values };
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .insert({
      title,
      org_id: orgId || null,
      person_id: personId || null,
      stage_id: stageId || null,
      value,
      expected_close_date: expectedCloseDate || null,
      owner_id: ownerId || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[deals] create failed:", error.message);
    return { error: "Could not save this deal. Try again.", values };
  }

  revalidatePath("/", "layout");
  redirect(`/deals/${data.id}`);
}

export type DealStageResult = { error: string | null };

/**
 * Moves a deal to a different pipeline stage and logs the move.
 *
 * Won and Lost are stages like any other in pipeline_stages, but
 * deals.status is a separate column with its own CHECK (lost_reason
 * required exactly when status = 'lost', forbidden otherwise) — nothing in
 * the schema keeps the two in sync on its own; 0011_seed_pipeline_stages.sql
 * says so directly: "the app sets both together when a deal closes." So this
 * derives status from the target stage's name and writes both columns in one
 * UPDATE regardless of direction, including moving back out of Won/Lost,
 * which reopens the deal and clears lost_reason (required by that same CHECK
 * — an open deal cannot carry a reason from a loss it's no longer in).
 */
export async function updateDealStage(
  dealId: string,
  toStageId: string,
  lostReason: string | null,
): Promise<DealStageResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select("stage_id")
    .eq("id", dealId)
    .single();

  if (dealError || !deal) {
    console.error("[deals] stage change: could not load deal:", dealError?.message);
    return { error: "Could not load this deal." };
  }

  // Not a real move — and stage_transitions_actually_moved would reject the
  // history row if this insert went ahead anyway.
  if (deal.stage_id === toStageId) return { error: null };

  const { data: toStage, error: stageError } = await supabase
    .from("pipeline_stages")
    .select("name")
    .eq("id", toStageId)
    .single();

  if (stageError || !toStage) {
    console.error("[deals] stage change: could not load target stage:", stageError?.message);
    return { error: "Could not load that stage." };
  }

  let status: "open" | "won" | "lost" = "open";
  let reason: string | null = null;

  if (toStage.name === "Won") {
    status = "won";
  } else if (toStage.name === "Lost") {
    reason = lostReason?.trim() || "";
    if (!reason) return { error: "Enter a reason before marking this deal lost." };
    status = "lost";
  }

  const { error: updateError } = await supabase
    .from("deals")
    .update({ stage_id: toStageId, status, lost_reason: reason || null })
    .eq("id", dealId);

  if (updateError) {
    console.error("[deals] stage update failed:", updateError.message);
    return { error: "Could not update the stage." };
  }

  const { error: transitionError } = await supabase.from("stage_transitions").insert({
    deal_id: dealId,
    from_stage_id: deal.stage_id,
    to_stage_id: toStageId,
    changed_by: user.id,
  });

  if (transitionError) {
    // The stage itself already moved correctly; a failed history row is
    // secondary and not worth reporting as if the whole change failed.
    console.error("[deals] stage transition log failed:", transitionError.message);
  }

  revalidatePath("/", "layout");
  return { error: null };
}
