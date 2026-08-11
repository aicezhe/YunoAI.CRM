import "server-only";
import { sortByPriority } from "@/lib/activity-order";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActivityRow, type Result } from "./types";

const ACTIVITY_SELECT = `
  id, type, priority, subject, due_at, done,
  deal:deals(id, title),
  person:persons(id, name),
  organization:organizations(id, name)
`;

type RawActivity = {
  id: string;
  type: string;
  priority: string;
  subject: string;
  due_at: string | null;
  done: boolean;
  deal: { id: string; title: string } | null;
  person: { id: string; name: string } | null;
  organization: { id: string; name: string } | null;
};

function toActivityRow(row: RawActivity): ActivityRow {
  return {
    id: row.id,
    type: row.type as ActivityRow["type"],
    priority: row.priority as ActivityRow["priority"],
    subject: row.subject,
    dueAt: row.due_at,
    done: row.done,
    dealId: row.deal?.id ?? null,
    dealTitle: row.deal?.title ?? null,
    personId: row.person?.id ?? null,
    personName: row.person?.name ?? null,
    organizationId: row.organization?.id ?? null,
    organizationName: row.organization?.name ?? null,
  };
}

/**
 * Activities on one side of the done/not-done line.
 *
 * The two are separate screens rather than one list sorted by `done`: a
 * finished call is history, and mixing it into the working list means the
 * things still owed get pushed further down every time one is completed.
 */
export async function listActivities(done: boolean): Promise<Result<ActivityRow[]>> {
  const supabase = await createClient();

  const query = supabase.from("activities").select(ACTIVITY_SELECT).eq("done", done);

  // Open work reads soonest-first; the archive reads most-recently-finished
  // first, because that is the item someone is looking for when they open it.
  const { data, error } = done
    ? await query.order("due_at", { ascending: false, nullsFirst: false })
    : await query.order("due_at", { nullsFirst: false });

  if (error) return fail("listActivities", error.message);

  const rows = (data as unknown as RawActivity[]).map(toActivityRow);

  // Urgent floats to the top of the open list (see sortByPriority for why it
  // is ranked in TypeScript rather than ordered in SQL). Not applied to the
  // archive: priority answers "what do I do next", which a finished activity
  // no longer has an answer to.
  if (!done) sortByPriority(rows);

  return ok(rows);
}

/** Tab badges. A failed count degrades to zero rather than taking the
 *  section down — the lists below report their own failures. */
export async function countActivities(): Promise<{ open: number; archived: number }> {
  const supabase = await createClient();

  const [open, archived] = await Promise.all([
    supabase.from("activities").select("id", { count: "exact", head: true }).eq("done", false),
    supabase.from("activities").select("id", { count: "exact", head: true }).eq("done", true),
  ]);

  return { open: open.count ?? 0, archived: archived.count ?? 0 };
}

export async function getActivity(id: string): Promise<Result<ActivityRow | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) return fail("getActivity", error.message);
  return ok(data ? toActivityRow(data as unknown as RawActivity) : null);
}

/**
 * The activity feed on a contact's or a company's own record — the calls,
 * meetings and notes attached directly to them.
 *
 * Deliberately not widened to "everything that touches this company": an
 * activity on one of its deals belongs to that deal's feed, and pulling those
 * in here would show the same row twice to anyone reading both screens.
 *
 * Newest first, open or done alike, because this block is a history rather
 * than a to-do list — the record's own list is where work gets worked.
 */
export async function listActivitiesForPerson(personId: string): Promise<Result<ActivityRow[]>> {
  return activitiesRelatedTo("person_id", personId, "listActivitiesForPerson");
}

export async function listActivitiesForOrganization(orgId: string): Promise<Result<ActivityRow[]>> {
  return activitiesRelatedTo("org_id", orgId, "listActivitiesForOrganization");
}

async function activitiesRelatedTo(
  column: "person_id" | "org_id",
  id: string,
  context: string,
): Promise<Result<ActivityRow[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .eq(column, id)
    .order("due_at", { ascending: false, nullsFirst: false });

  if (error) return fail(context, error.message);
  return ok((data as unknown as RawActivity[]).map(toActivityRow));
}

export async function listActivitiesForDeal(dealId: string): Promise<Result<ActivityRow[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .eq("deal_id", dealId)
    .order("due_at", { nullsFirst: false });

  if (error) return fail("listActivitiesForDeal", error.message);
  return ok((data as unknown as RawActivity[]).map(toActivityRow));
}
