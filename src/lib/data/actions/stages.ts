"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/current-user";

/**
 * Server Actions for pipeline configuration — the Settings card.
 *
 * All admin-only, checked here first and enforced again by RLS
 * (pipeline_stages_write_admin, 0010): configuration is the one thing the
 * schema always said members read and admins reshape.
 *
 * Won and Lost are special-cased throughout. resolveStage() derives
 * deals.status from those two *names* — 0011 says it out loud: "the app
 * sets both together when a deal closes". Renaming, moving or deleting them
 * would silently break how deals close, so the actions refuse; the UI
 * explains the same thing before anyone gets here.
 */
const TERMINAL = ["Won", "Lost"] as const;

export type StageActionResult = { error: string | null };

/** Typed as a definite string so the Slot union below stays discriminated —
 *  `error: null` means a position, `error: string` means a refusal. */
function refusal(message: string): { error: string } {
  return { error: message };
}

async function requireAdmin(): Promise<StageActionResult | null> {
  if (await isAdmin()) return null;
  return refusal("Only an admin can change the pipeline.");
}

/**
 * Inserts a stage after the given one (or at the start), at the midpoint of
 * the two neighbouring positions — the whole reason positions step by 10
 * instead of 1. When the gap has no integer room left (…30, 31…), the
 * working stages are renumbered back onto the 10-step grid first; positions
 * are an internal ordering detail no other table references, so renumbering
 * is safe by construction.
 */
export async function createStage(
  name: string,
  afterStageId: string | null,
): Promise<StageActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const trimmed = name.trim();
  if (!trimmed) return refusal("Enter a name for the stage.");
  if ((TERMINAL as readonly string[]).includes(trimmed)) {
    return refusal(`"${trimmed}" is reserved — the app closes deals through it.`);
  }

  const supabase = await createClient();
  const { data: stages, error } = await supabase
    .from("pipeline_stages")
    .select("id, name, position")
    .order("position");

  if (error || !stages) {
    console.error("[stages] create: could not load stages:", error?.message);
    return refusal("Could not load the pipeline. Try again.");
  }

  // New stages live among the working stages: the last valid slot is just
  // before the first terminal stage, and "after Won" is not offered by the
  // UI nor accepted here.
  const firstTerminal = stages.find((s) => (TERMINAL as readonly string[]).includes(s.name));
  if (afterStageId && firstTerminal) {
    const after = stages.find((s) => s.id === afterStageId);
    if (!after) return refusal("That stage no longer exists.");
    if (after.position >= firstTerminal.position) {
      return refusal("New stages go before the closing stages.");
    }
  }

  const slot = await positionFor(supabase, stages, afterStageId);
  if (slot.error !== null) return slot;

  const { error: insertError } = await supabase
    .from("pipeline_stages")
    .insert({ name: trimmed, position: slot.position });

  if (insertError) {
    if (insertError.code === "23505") return refusal(`A stage called "${trimmed}" already exists.`);
    console.error("[stages] create failed:", insertError.message);
    return refusal("Could not add the stage. Try again.");
  }

  revalidatePath("/", "layout");
  return { error: null };
}

type Slot = { error: null; position: number } | { error: string };

async function positionFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  stages: { id: string; position: number }[],
  afterStageId: string | null,
): Promise<Slot> {
  const index = afterStageId ? stages.findIndex((s) => s.id === afterStageId) : -1;
  if (afterStageId && index === -1) return refusal("That stage no longer exists.");

  const prev = index === -1 ? null : stages[index];
  const next = stages[index + 1] ?? null;

  if (!prev && !next) return { error: null, position: 10 };
  if (!prev && next) {
    // At the start. Any positive neighbour leaves at least one integer below
    // it; only a first stage already sitting at 0 forces a renumber.
    if (next.position >= 1) return { error: null, position: Math.floor(next.position / 2) };
  } else if (prev && !next) {
    return { error: null, position: prev.position + 10 };
  } else if (prev && next && next.position - prev.position >= 2) {
    // The midpoint the 10-step grid exists for: between 30 and 40 → 35, and
    // neither neighbour moves.
    return { error: null, position: Math.floor((prev.position + next.position) / 2) };
  }

  // No integer room in this gap (…30, 31…). Put everything back on the
  // 10-step grid — order preserved, ids untouched, and position is an
  // internal ordering detail no other table references — then recurse once
  // into a gap that now must exist. Two passes with a +1000 offset so the
  // UNIQUE constraint never sees a duplicate mid-flight.
  const renumbered = stages.map((s, i) => ({ ...s, position: (i + 1) * 10 }));
  for (const pass of [1000, 0]) {
    for (const s of renumbered) {
      const { error } = await supabase
        .from("pipeline_stages")
        .update({ position: s.position + pass })
        .eq("id", s.id);
      if (error) {
        console.error("[stages] renumber failed:", error.message);
        return refusal("Could not make room for the stage. Try again.");
      }
    }
  }

  return positionFor(supabase, renumbered, afterStageId);
}

/** Renames a working stage. The id — what deals and history point at — never
 *  changes, which is the entire argument for stages being a table. */
export async function renameStage(id: string, name: string): Promise<StageActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const trimmed = name.trim();
  if (!trimmed) return refusal("Enter a name for the stage.");
  if ((TERMINAL as readonly string[]).includes(trimmed)) {
    return refusal(`"${trimmed}" is reserved — the app closes deals through it.`);
  }

  const supabase = await createClient();
  const { data: stage } = await supabase
    .from("pipeline_stages")
    .select("name")
    .eq("id", id)
    .single();

  if (!stage) return refusal("That stage no longer exists.");
  if ((TERMINAL as readonly string[]).includes(stage.name)) {
    return refusal("Won and Lost can't be renamed — deals close through these names.");
  }

  const { error } = await supabase.from("pipeline_stages").update({ name: trimmed }).eq("id", id);

  if (error) {
    if (error.code === "23505") return refusal(`A stage called "${trimmed}" already exists.`);
    console.error("[stages] rename failed:", error.message);
    return refusal("Could not rename the stage. Try again.");
  }

  revalidatePath("/", "layout");
  return { error: null };
}

/**
 * Swaps a working stage with its neighbour in the given direction.
 *
 * position is UNIQUE, so this is the documented three-step from
 * 0003_pipeline_stages.sql: park one row on a free number, move the other,
 * land the first — the constraint never sees a duplicate mid-flight.
 */
export async function moveStage(id: string, direction: "up" | "down"): Promise<StageActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { data: stages, error } = await supabase
    .from("pipeline_stages")
    .select("id, name, position")
    .order("position");

  if (error || !stages) {
    console.error("[stages] move: could not load stages:", error?.message);
    return refusal("Could not load the pipeline. Try again.");
  }

  const working = stages.filter((s) => !(TERMINAL as readonly string[]).includes(s.name));
  const index = working.findIndex((s) => s.id === id);
  if (index === -1) return refusal("Won and Lost keep their place at the end.");

  const swapWith = direction === "up" ? working[index - 1] : working[index + 1];
  if (!swapWith) return { error: null }; // already at the edge — nothing to do

  const a = working[index];
  const parking = Math.max(...stages.map((s) => s.position)) + 1000;

  const steps = [
    { id: a.id, position: parking },
    { id: swapWith.id, position: a.position },
    { id: a.id, position: swapWith.position },
  ];
  for (const step of steps) {
    const { error: stepError } = await supabase
      .from("pipeline_stages")
      .update({ position: step.position })
      .eq("id", step.id);
    if (stepError) {
      console.error("[stages] move failed:", stepError.message);
      return refusal("Could not reorder. Reload and try again.");
    }
  }

  revalidatePath("/", "layout");
  return { error: null };
}

/**
 * Deletes a stage nothing depends on. Both FKs onto this table are RESTRICT,
 * so the database would refuse anyway; checking first turns a raw FK error
 * into the two sentences the UI shows — and the UI hides the button in both
 * cases before anyone gets here.
 */
export async function deleteStage(id: string): Promise<StageActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const supabase = await createClient();

  const { data: stage } = await supabase
    .from("pipeline_stages")
    .select("name")
    .eq("id", id)
    .single();
  if (!stage) return { error: null }; // already gone — the goal is met

  if ((TERMINAL as readonly string[]).includes(stage.name)) {
    return refusal("Won and Lost can't be deleted — deals close through them.");
  }

  const [deals, transitions] = await Promise.all([
    supabase.from("deals").select("id", { count: "exact", head: true }).eq("stage_id", id),
    supabase
      .from("stage_transitions")
      .select("id", { count: "exact", head: true })
      .or(`from_stage_id.eq.${id},to_stage_id.eq.${id}`),
  ]);

  if ((deals.count ?? 0) > 0) {
    return refusal(
      `${deals.count} ${deals.count === 1 ? "deal is" : "deals are"} on this stage — move them first.`,
    );
  }
  if ((transitions.count ?? 0) > 0) {
    return refusal(
      `This stage appears in ${transitions.count} stage-history ${
        transitions.count === 1 ? "entry" : "entries"
      } and can't be deleted — the history is append-only.`,
    );
  }

  const { error } = await supabase.from("pipeline_stages").delete().eq("id", id);

  if (error) {
    console.error("[stages] delete failed:", error.message);
    return refusal("Could not delete the stage. Try again.");
  }

  revalidatePath("/", "layout");
  return { error: null };
}
