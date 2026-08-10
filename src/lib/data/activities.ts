import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActivityRow, type ActivityType, type Result } from "./types";

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

  // Urgent floats to the top of the open list, keeping the due-date order
  // the query already applied within each group (Array#sort is stable).
  //
  // Ranked explicitly rather than ordered on the column: 'urgent' > 'normal'
  // alphabetically only by luck, and the moment a third value is added the
  // accident stops holding — the same reason listDeals ranks status here
  // instead of in SQL.
  //
  // Not applied to the archive: priority answers "what do I do next", which
  // a finished activity no longer has an answer to.
  if (!done) rows.sort((a, b) => priorityRank(a) - priorityRank(b));

  return ok(rows);
}

function priorityRank(activity: ActivityRow): number {
  return activity.priority === "urgent" ? 0 : 1;
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

export type TodayBoard = {
  overdue: ActivityRow[];
  today: ActivityRow[];
};

/** Local-midnight day boundaries, shared by the board and the completed-today
 *  count below so the two queries can't quietly drift onto different
 *  definitions of "today". */
function todayRange(): { startOfDay: Date; startOfTomorrow: Date } {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfDay);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  return { startOfDay, startOfTomorrow };
}

/**
 * The dashboard's main block: what is owed right now, for one person.
 *
 * The day boundary is computed from the server's local clock, not from UTC.
 * `due_at` is a timestamptz, so "today" has to mean the viewer's calendar day
 * — with a UTC boundary, an evening task in Rome would already count as
 * tomorrow's for two hours every night.
 *
 * Scoped to `userId` (created_by): the dashboard answers "what should I start
 * with", and someone else's overdue call is not that, even though activities
 * themselves are team-visible everywhere else in the app.
 */
export async function getTodayBoard(userId: string): Promise<Result<TodayBoard>> {
  const supabase = await createClient();
  const { startOfDay, startOfTomorrow } = todayRange();

  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .eq("done", false)
    .eq("created_by", userId)
    .not("due_at", "is", null)
    .lt("due_at", startOfTomorrow.toISOString())
    .order("due_at");

  if (error) return fail("getTodayBoard", error.message);

  const rows = (data as unknown as RawActivity[]).map(toActivityRow);
  const dayStart = startOfDay.getTime();

  // One query, split here rather than two round-trips for two halves of the
  // same window.
  return ok({
    overdue: rows.filter((r) => new Date(r.dueAt!).getTime() < dayStart),
    today: rows.filter((r) => new Date(r.dueAt!).getTime() >= dayStart),
  });
}

export type CompletedToday = Partial<Record<ActivityType, number>>;

/**
 * How much of today's own work is already done, by type — the dashboard's
 * "Today: 3 calls, 1 meeting completed" caption once the list is clear.
 *
 * There is no completed_at column (0008_activities.sql has only created_at),
 * so this approximates "completed today" as "due today, and done" rather
 * than "marked done today". That is the same window the dashboard's own
 * checkboxes operate on — every activity they can complete is due today by
 * construction, since overdue items have no inline checkbox — so the
 * approximation stays consistent with what actually happens in a session,
 * even though it would miss, say, an overdue task completed from the
 * Activities page instead.
 */
export async function getCompletedTodayByType(userId: string): Promise<Result<CompletedToday>> {
  const supabase = await createClient();
  const { startOfDay, startOfTomorrow } = todayRange();

  const { data, error } = await supabase
    .from("activities")
    .select("type")
    .eq("done", true)
    .eq("created_by", userId)
    .gte("due_at", startOfDay.toISOString())
    .lt("due_at", startOfTomorrow.toISOString());

  if (error) return fail("getCompletedTodayByType", error.message);

  const counts: CompletedToday = {};
  for (const row of data as { type: ActivityType }[]) {
    counts[row.type] = (counts[row.type] ?? 0) + 1;
  }
  return ok(counts);
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
