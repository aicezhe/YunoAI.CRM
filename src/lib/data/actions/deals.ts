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
  currency: string;
  expectedCloseDate: string;
  ownerId: string;
  /** Only reachable in edit mode, and only meaningful when the chosen stage
   *  is Lost — see resolveStage. */
  lostReason: string;
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
  const currency = String(formData.get("currency") ?? "EUR");
  const expectedCloseDate = String(formData.get("expectedCloseDate") ?? "");

  // Whoever is adding the deal owns it. Read from the session rather than
  // from the form: the create form shows the owner but does not offer a
  // choice, so a posted ownerId could only have been put there by hand —
  // and a form field is a claim, not an authorisation. Reassignment happens
  // on the deal itself, where it is an explicit act.
  const owner = await requireUser();
  const ownerId = owner.id;

  const values: DealFormValues = {
    title,
    orgId,
    personId,
    stageId,
    value: rawValue,
    currency,
    expectedCloseDate,
    ownerId,
    // A deal starts open by construction, so there is nothing to explain.
    lostReason: "",
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
      currency: currency || null,
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

/**
 * Turns a target stage into the two columns that have to move with it.
 *
 * Won and Lost are stages like any other in pipeline_stages, but
 * deals.status is a separate column with its own CHECK (lost_reason required
 * exactly when status = 'lost', forbidden otherwise) — nothing in the schema
 * keeps the two in sync on its own; 0011_seed_pipeline_stages.sql says so
 * directly: "the app sets both together when a deal closes."
 *
 * Shared by the stage stepper and the edit form so the two cannot drift into
 * different ideas of what "Lost" means.
 */
async function resolveStage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  toStageId: string | null,
  lostReason: string | null,
): Promise<
  { ok: true; status: "open" | "won" | "lost"; lostReason: string | null } | { ok: false; error: string }
> {
  // No stage at all is a valid state (the column is nullable) and cannot be
  // won or lost.
  if (!toStageId) return { ok: true, status: "open", lostReason: null };

  const { data: stage, error } = await supabase
    .from("pipeline_stages")
    .select("name")
    .eq("id", toStageId)
    .single();

  if (error || !stage) {
    console.error("[deals] could not load target stage:", error?.message);
    return { ok: false, error: "Could not load that stage." };
  }

  if (stage.name === "Won") return { ok: true, status: "won", lostReason: null };

  if (stage.name === "Lost") {
    const reason = lostReason?.trim() ?? "";
    if (!reason) return { ok: false, error: "Enter a reason before marking this deal lost." };
    return { ok: true, status: "lost", lostReason: reason };
  }

  // Moving back out of Won/Lost reopens the deal and clears the reason —
  // required by that same CHECK, since an open deal cannot carry a reason
  // for a loss it is no longer in.
  return { ok: true, status: "open", lostReason: null };
}

/**
 * Appends to the deal's history. Only ever called after the deal itself has
 * moved, and only when it actually moved — stage_transitions_actually_moved
 * rejects a row whose from and to are the same.
 *
 * A failure here is logged and swallowed: the stage change already happened
 * correctly, and reporting it as a failed save would be wrong about what the
 * user just did.
 */
async function logStageTransition(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dealId: string,
  fromStageId: string | null,
  toStageId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase.from("stage_transitions").insert({
    deal_id: dealId,
    from_stage_id: fromStageId,
    to_stage_id: toStageId,
    changed_by: userId,
  });

  if (error) console.error("[deals] stage transition log failed:", error.message);
}

export type DealStageResult = { error: string | null };

/** Moves a deal to a different pipeline stage and logs the move. The stage
 *  stepper on the deal's own record; see resolveStage for how status and
 *  lost_reason follow the stage. */
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

  const resolved = await resolveStage(supabase, toStageId, lostReason);
  if (!resolved.ok) return { error: resolved.error };

  const { error: updateError } = await supabase
    .from("deals")
    .update({ stage_id: toStageId, status: resolved.status, lost_reason: resolved.lostReason })
    .eq("id", dealId);

  if (updateError) {
    console.error("[deals] stage update failed:", updateError.message);
    return { error: "Could not update the stage." };
  }

  await logStageTransition(supabase, dealId, deal.stage_id, toStageId, user.id);

  revalidatePath("/", "layout");
  return { error: null };
}

/**
 * The deal edit form.
 *
 * Distinct from updateDealStage, which the stepper on the deal's own record
 * uses for a stage move alone. This writes every editable column in one go —
 * but routes the stage through the same resolveStage/logStageTransition pair,
 * so changing the stage here is recorded in the deal's history exactly as it
 * would be from the stepper. A second way to move a deal that skipped the
 * log would make the history quietly wrong, which is worse than not having
 * the form at all: "how long do deals sit in Proposal" is the question
 * stage_transitions exists to answer.
 *
 * Owner is editable here and only here — the create form fills it from the
 * session (see createDeal). Handing a deal to a colleague is a deliberate
 * act, which is what an edit form is.
 */
export async function updateDeal(
  id: string,
  _prevState: DealFormState,
  formData: FormData,
): Promise<DealFormState> {
  const user = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const orgId = String(formData.get("orgId") ?? "");
  const personId = String(formData.get("personId") ?? "");
  const stageId = String(formData.get("stageId") ?? "");
  const rawValue = String(formData.get("value") ?? "").trim();
  const currency = String(formData.get("currency") ?? "EUR");
  const expectedCloseDate = String(formData.get("expectedCloseDate") ?? "");
  const ownerId = String(formData.get("ownerId") ?? "");
  const lostReason = String(formData.get("lostReason") ?? "");

  const values: DealFormValues = {
    title,
    orgId,
    personId,
    stageId,
    value: rawValue,
    currency,
    expectedCloseDate,
    ownerId,
    lostReason,
  };

  // Same rules as creation — 0006_deals.sql does not relax for an update.
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

  // Read the stage it is on now, before the update, so the history row knows
  // where the deal came from.
  const { data: current, error: currentError } = await supabase
    .from("deals")
    .select("stage_id")
    .eq("id", id)
    .single();

  if (currentError || !current) {
    console.error("[deals] update: could not load deal:", currentError?.message);
    return { error: "Could not load this deal.", values };
  }

  const resolved = await resolveStage(supabase, stageId || null, lostReason);
  if (!resolved.ok) return { error: resolved.error, values };

  const { error } = await supabase
    .from("deals")
    .update({
      title,
      org_id: orgId || null,
      person_id: personId || null,
      stage_id: stageId || null,
      status: resolved.status,
      lost_reason: resolved.lostReason,
      value,
      currency: currency || null,
      expected_close_date: expectedCloseDate || null,
      owner_id: ownerId || null,
    })
    .eq("id", id);

  if (error) {
    console.error("[deals] update failed:", error.message);
    return { error: "Could not save your changes. Try again.", values };
  }

  // Only a real move is logged, and only after the deal itself has moved —
  // stage_transitions_actually_moved rejects a row that goes nowhere, and a
  // history entry for a change that failed would be a lie.
  if (stageId && stageId !== current.stage_id) {
    await logStageTransition(supabase, id, current.stage_id, stageId, user.id);
  }

  revalidatePath("/", "layout");
  redirect(`/deals/${id}`);
}
