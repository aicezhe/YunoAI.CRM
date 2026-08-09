"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Tick an activity off from wherever it is listed.
 *
 * The dashboard's whole premise is that today's work can be cleared without
 * leaving the screen, so this is a Server Action rather than a link to an
 * edit form. revalidatePath("/", "layout") rather than a single route: the
 * same activity drives the dashboard count, the activities table and the
 * deal's own feed, and ticking it on one must not leave the others stale.
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
