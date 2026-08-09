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
