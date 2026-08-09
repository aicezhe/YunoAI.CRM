import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActivityRow, type ContractRow, type Result } from "./types";

const ACTIVITY_SELECT = `
  id, type, subject, due_at, done,
  deal:deals(id, title),
  person:persons(id, name),
  organization:organizations(id, name)
`;

type RawActivity = {
  id: string;
  type: string;
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
  return ok((data as unknown as RawActivity[]).map(toActivityRow));
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

/**
 * The dashboard's main block: what is owed right now.
 *
 * The day boundary is computed from the server's local clock, not from UTC.
 * `due_at` is a timestamptz, so "today" has to mean the viewer's calendar day
 * — with a UTC boundary, an evening task in Rome would already count as
 * tomorrow's for two hours every night.
 */
export async function getTodayBoard(): Promise<Result<TodayBoard>> {
  const supabase = await createClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfDay);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .eq("done", false)
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

export async function listContracts(): Promise<Result<ContractRow[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select("id, signed_date, value, notes, deal:deals(id, title)")
    .order("signed_date", { ascending: false });

  if (error) return fail("listContracts", error.message);

  type RawContract = {
    id: string;
    signed_date: string;
    value: string | number | null;
    notes: string | null;
    deal: { id: string; title: string } | null;
  };

  return ok(
    (data as unknown as RawContract[]).map((row) => ({
      id: row.id,
      dealId: row.deal?.id ?? "",
      dealTitle: row.deal?.title ?? null,
      signedDate: row.signed_date,
      value: row.value === null ? null : Number(row.value),
      notes: row.notes,
    })),
  );
}
