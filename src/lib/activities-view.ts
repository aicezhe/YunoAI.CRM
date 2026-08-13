import type { ActivityRow } from "@/lib/data/types";
import type { SortDirection } from "@/components/ui/sort";

/**
 * Ordering for the activity lists, kept out of the component for the same
 * reason deals-view is: this is the part that can be wrong without looking
 * wrong, and a test can only reach it if it does not need a rendered table.
 *
 * Urgent work is pinned above everything else and sorted by date inside its
 * own block; everything else follows, also by date. Flipping the direction
 * flips both blocks.
 *
 * The pin was tried, removed and brought back, and the lesson is worth
 * recording: pinning on its own reads as a broken sort. A column headed by a
 * sort arrow promises that reading down it reads the dates in order, and
 * "17 Aug, 11 Aug, 10 Sept" breaks that promise silently — the reader has no
 * way to know the first two rows are pinned rather than misplaced. The fix
 * is not to drop the pin but to *say* it: the table draws a caption above
 * each block (see ActivityTable), so the two rows read as a group rather
 * than as a bug.
 */
export function isUrgent(activity: ActivityRow): boolean {
  // Done work is never pinned: priority answers "what do I do next", which a
  // finished activity no longer has an answer to.
  return activity.priority === "urgent" && !activity.done;
}

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

/**
 * The list split into its two blocks, each already sorted. Returned as a
 * pair rather than one flat array so the table can caption them — a pinned
 * block that is not labelled is exactly what made this read as broken.
 */
export function groupActivities(
  activities: ActivityRow[],
  direction: SortDirection,
  pinUrgent: boolean,
): { urgent: ActivityRow[]; rest: ActivityRow[] } {
  const sorted = sortActivities(activities, direction);
  if (!pinUrgent) return { urgent: [], rest: sorted };
  return {
    urgent: sorted.filter(isUrgent),
    rest: sorted.filter((a) => !isUrgent(a)),
  };
}
