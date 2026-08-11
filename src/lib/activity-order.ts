import type { ActivityRow } from "@/lib/data/types";

/**
 * Urgent work first in the open list.
 *
 * A rank rather than an ORDER BY on the column: 'urgent' sorts before
 * 'normal' alphabetically only by luck, and the accident stops holding the
 * moment a third priority is added. Ranking it here says the intent out
 * loud, and — being ordinary TypeScript rather than SQL — it can be tested
 * without a database.
 *
 * Array#sort is stable, so whatever order the query already applied (due
 * date, soonest first) survives inside each priority group.
 */
function priorityRank(activity: ActivityRow): number {
  return activity.priority === "urgent" ? 0 : 1;
}

/** Sorts in place and returns the same array — the caller owns rows it has
 *  just built from a query response, so there is nothing to protect. */
export function sortByPriority(rows: ActivityRow[]): ActivityRow[] {
  return rows.sort((a, b) => priorityRank(a) - priorityRank(b));
}
