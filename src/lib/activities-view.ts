import type { ActivityRow } from "@/lib/data/types";
import type { SortDirection } from "@/components/ui/sort";

/**
 * Ordering for the activity lists, kept out of the component for the same
 * reason deals-view is: this is the part that can be wrong without looking
 * wrong — an activity with no due date floating to the top — and a test can
 * only reach it if it does not need a rendered table to get at it.
 *
 * Date, and only date. Urgent work used to be pinned above everything
 * regardless of direction, which was a mistake: a column with a sort arrow
 * on it promises that reading down the column reads the dates in order, and
 * two pinned rows at the top break that promise in the most visible way
 * possible — "17 Aug, 11 Aug, 10 Sep" looks like the sort is broken, and no
 * amount of being technically right fixes how it reads.
 *
 * Urgency has its own, better signal on the row already: the amber mark
 * before the subject and the lavender wash across it. That says "look here"
 * without lying about where the row belongs in time.
 */
export function compareActivities(direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;

  return (a: ActivityRow, b: ActivityRow): number => {
    // No due date is not "the earliest" and not "the latest" — it is unknown,
    // so it sits out of the ordering entirely and stays last either way.
    if (a.dueAt === null) return b.dueAt === null ? 0 : 1;
    if (b.dueAt === null) return -1;

    return a.dueAt < b.dueAt ? -sign : a.dueAt > b.dueAt ? sign : 0;
  };
}

/** Returns a new array; the caller's rows are never reordered in place. */
export function sortActivities(
  activities: ActivityRow[],
  direction: SortDirection,
): ActivityRow[] {
  return [...activities].sort(compareActivities(direction));
}
