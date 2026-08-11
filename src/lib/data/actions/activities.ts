"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/current-user";

/**
 * Server Actions for activities: ticking one done, emptying the archive,
 * and the two create forms (standalone, and the one embedded in a deal).
 */

/**
 * Tick an activity off from wherever it is listed.
 *
 * Work should be tickable from wherever it is shown, without leaving the
 * screen, so this is a Server Action rather than a link to an edit form.
 * revalidatePath("/", "layout") rather than a single route: the same
 * activity drives the sidebar's count, the activities table and the deal's
 * own feed, and ticking it in one place must not leave the others stale.
 */
export async function setActivityDone(id: string, done: boolean): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("activities").update({ done }).eq("id", id);

  if (error) {
    console.error("[activities] toggle failed:", error.message);
    // Thrown, not returned: the caller is an optimistic checkbox, and the
    // rejection is what tells React to roll the tick back.
    throw new Error("Could not update this activity.");
  }

  revalidatePath("/", "layout");
}

/**
 * Empties the archive: deletes every completed activity, for everyone.
 *
 * A hard delete, not a flag. An "archived" flag on top of `done` would mean
 * three states for one boolean question and a third list to keep straight,
 * and the point of clearing an archive is that the rows stop existing.
 *
 * Deliberately not scoped to the caller: activities are team-wide here (see
 * the RLS policies in the migration), so clearing removes the team's finished
 * history, not just your own. The button that calls this says so and asks
 * twice — that confirmation is the only thing between a click and permanent
 * loss, since there is no undo.
 *
 * Returns the number deleted so the caller can report it.
 */
export async function clearActivityArchive(): Promise<number> {
  const supabase = await createClient();

  // .select() makes the delete return the rows it removed, which is the only
  // way to get a count back — Postgres gives no row count through PostgREST
  // otherwise.
  const { data, error } = await supabase
    .from("activities")
    .delete()
    .eq("done", true)
    .select("id");

  if (error) {
    console.error("[activities] clearing archive failed:", error.message);
    throw new Error("Could not clear the archive.");
  }

  revalidatePath("/", "layout");
  return data.length;
}

export type ActivityFormValues = {
  type: string;
  subject: string;
  dealId: string;
  personId: string;
  orgId: string;
  dueAt: string;
  /** "urgent" when the form's checkbox is ticked, "normal" otherwise. */
  priority: string;
};

export type ActivityFormState = { error: string | null; values: ActivityFormValues };

/**
 * Validation mirrors 0008_activities.sql: type and subject are NOT NULL, and
 * activities_has_link requires at least one of deal/person/org — any one is
 * enough, matching the schema comment's own reasoning (a call from a
 * company's main line has no person to attach; a note on a deal has neither).
 *
 * created_by is not a form field — it is always the signed-in user. Letting
 * someone log an activity "as" a colleague via a picker would misattribute
 * it; requireUser() is the same authorization boundary every protected page
 * already relies on. done is not a field either: every activity starts
 * open (false) — ticking one off is a separate action once it exists.
 *
 * dueAt is the one field that changes shape: `datetime-local` inputs submit
 * "2026-08-09T14:30" with no timezone, which Postgres would otherwise read
 * as UTC. `new Date(...)` interprets that string in the server's own local
 * time instead, which is what the picker showed the person filling it in.
 *
 * Shared by createActivity and createDealActivity below — same validation
 * and insert either way, they only differ in what happens after it succeeds.
 */
async function insertActivity(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string; values: ActivityFormValues }> {
  const type = String(formData.get("type") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const dealId = String(formData.get("dealId") ?? "");
  const personId = String(formData.get("personId") ?? "");
  const orgId = String(formData.get("orgId") ?? "");
  const dueAt = String(formData.get("dueAt") ?? "");
  // An unchecked checkbox submits nothing at all, so absence is the "normal"
  // case rather than a missing value to complain about. Narrowed to the two
  // allowed strings here so a hand-crafted POST can't get past the column's
  // CHECK and surface as a generic database error.
  const priority = formData.get("priority") === "urgent" ? "urgent" : "normal";

  const values: ActivityFormValues = { type, subject, dealId, personId, orgId, dueAt, priority };

  if (!type) return { ok: false, error: "Choose a type.", values };
  if (!subject) return { ok: false, error: "Enter a subject.", values };
  if (!dealId && !personId && !orgId) {
    return { ok: false, error: "Link this to a deal, a contact or an organization.", values };
  }

  const user = await requireUser();

  const supabase = await createClient();
  const { error } = await supabase.from("activities").insert({
    type,
    subject,
    priority,
    deal_id: dealId || null,
    person_id: personId || null,
    org_id: orgId || null,
    due_at: dueAt ? new Date(dueAt).toISOString() : null,
    created_by: user.id,
  });

  if (error) {
    console.error("[activities] create failed:", error.message);
    return { ok: false, error: "Could not save this activity. Try again.", values };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function createActivity(
  _prevState: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  const result = await insertActivity(formData);
  if (!result.ok) return { error: result.error, values: result.values };
  redirect("/activities/open");
}

export type DealActivityFormState = { error: string | null; values: ActivityFormValues; done: boolean };

/**
 * Same as createActivity, for the inline "+ Add activity" form on a deal's
 * own page. Deal/contact/org are fixed there rather than chosen, and the
 * point of adding from the deal page is staying on it to see the new row
 * land — so this returns a state the form can react to instead of
 * redirecting to the general activities list.
 */
export async function createDealActivity(
  prevState: DealActivityFormState,
  formData: FormData,
): Promise<DealActivityFormState> {
  const result = await insertActivity(formData);
  if (!result.ok) return { error: result.error, values: result.values, done: false };
  return { error: null, values: prevState.values, done: true };
}
