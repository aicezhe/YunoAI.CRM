import type { ActivityRow } from "@/lib/data/types";
import type { SortDirection } from "@/components/ui/sort";

/**
 * Ordering for the activity lists, kept out of the component for the same
 * reason deals-view is: this is the part that can be wrong without looking
 * wrong — an activity with no due date floating to the top, urgent work
 * sliding down the page when the order is flipped — and a test can only
 * reach it if it does not need a rendered table to get at it.
 */

/**
 * Urgent stays pinned to the top whichever way the dates run.
 *
 * The flag is a pin, not a sort key: its whole purpose is "look at this
 * first", and a rule that surrenders the moment someone reverses the date
 * order would not be worth setting. Sorting therefore happens *within* the
 * two groups — flip the direction and the urgent block flips internally,
 * without leaving the top.
 *
 * Done activities are never pinned: priority answers "what do I do next",
 * which finished work no longer has an answer to. That is also why the
 * archive passes pinUrgent = false.
 */
function urgentRank(activity: ActivityRow): number {
  return activity.priority === "urgent" && !activity.done ? 0 : 1;
}

export function compareActivities(direction: SortDirection, pinUrgent: boolean) {
  const sign = direction === "asc" ? 1 : -1;

  return (a: ActivityRow, b: ActivityRow): number => {
    if (pinUrgent) {
      const rank = urgentRank(a) - urgentRank(b);
      if (rank !== 0) return rank;
    }

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
  pinUrgent: boolean,
): ActivityRow[] {
  return [...activities].sort(compareActivities(direction, pinUrgent));
}
