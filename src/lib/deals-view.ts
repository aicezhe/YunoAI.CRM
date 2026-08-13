import type { DealRow } from "@/lib/data/types";

/**
 * The rules behind the Deals list: what a click on a column does, how rows
 * order, which rows a filter keeps, and which dates count as overdue.
 *
 * Pulled out of deals-table.tsx and kept free of React on purpose. This is
 * the only part of that screen that can be wrong in a way a screenshot will
 * not show — a deal with no value sorting to the top, "closing this week"
 * quietly including yesterday — so it is the part worth testing directly,
 * and a test can only reach it if it does not need a rendered component to
 * get at it.
 */

export type SortKey = "value" | "expectedClose" | "stage";
// Re-exported rather than redeclared: the sort controls own this type, and
// two identical unions in two files are one rename away from disagreeing.
export type { SortDirection } from "@/components/ui/sort";
export type Sort = { key: SortKey; direction: "asc" | "desc" };

export type DealFilters = {
  openOnly: boolean;
  myDealsOnly: boolean;
  closingThisWeek: boolean;
};

// The direction a first click on each column should produce: value leads
// with the biggest deals (what to prioritize), expected close leads with the
// soonest (what's burning). Stage never toggles — see stageRank below.
export const DEFAULT_DIRECTION: Record<SortKey, "asc" | "desc"> = {
  value: "desc",
  expectedClose: "asc",
  stage: "asc",
};

/**
 * What clicking a column header does: a new column starts at its own default
 * direction, the active one flips. Stage is the exception — its order is the
 * funnel, and a reversed funnel is not a view anybody wants.
 */
export function nextSort(current: Sort, key: SortKey): Sort {
  if (current.key !== key) return { key, direction: DEFAULT_DIRECTION[key] };
  if (key === "stage") return current;
  return { key, direction: current.direction === "asc" ? "desc" : "asc" };
}

/** Funnel order: open deals by pipeline position, then Won, then Lost — a
 *  closed deal keeps whatever stage it was in when it closed, so status has
 *  to be checked first or Won/Lost would scatter across the open ranks. */
export function stageRank(deal: DealRow): [number, number] {
  if (deal.status === "won") return [1, 0];
  if (deal.status === "lost") return [2, 0];
  return [0, deal.stagePosition ?? Infinity];
}

export function compareDeals(key: SortKey, direction: "asc" | "desc") {
  const sign = direction === "asc" ? 1 : -1;
  return (a: DealRow, b: DealRow): number => {
    if (key === "stage") {
      const [bucketA, posA] = stageRank(a);
      const [bucketB, posB] = stageRank(b);
      return bucketA !== bucketB ? bucketA - bucketB : posA - posB;
    }
    if (key === "value") {
      // A deal with no value is neither the biggest nor the smallest — it's
      // unknown, so it sits out of the ranking entirely, last either way.
      if (a.value === null) return b.value === null ? 0 : 1;
      if (b.value === null) return -1;
      return (a.value - b.value) * sign;
    }
    if (a.expectedCloseDate === null) return b.expectedCloseDate === null ? 0 : 1;
    if (b.expectedCloseDate === null) return -1;
    return a.expectedCloseDate < b.expectedCloseDate
      ? -sign
      : a.expectedCloseDate > b.expectedCloseDate
        ? sign
        : 0;
  };
}

/** YYYY-MM-DD, matching the date-only column so "this week"/"overdue" can
 *  compare as plain strings instead of parsing a date-only value as a Date —
 *  the latter reads it as UTC midnight, which drifts against the viewer's
 *  local "today" by the timezone offset. */
export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The date a week out, as the inclusive far edge of "closing this week". */
export function weekOut(from: Date): string {
  const d = new Date(from);
  d.setDate(d.getDate() + 7);
  return isoDate(d);
}

export function isOverdue(deal: DealRow, today: string): boolean {
  return deal.status === "open" && deal.expectedCloseDate !== null && deal.expectedCloseDate < today;
}

/**
 * Filters, then sorts. Every filter is an AND — the chips narrow together
 * rather than each replacing the last, which is what makes "my deals" +
 * "closing this week" answer the question a rep actually has.
 *
 * Returns a new array; the caller's `deals` is never reordered in place.
 */
export function visibleDeals(
  deals: DealRow[],
  filters: DealFilters,
  sort: Sort,
  ctx: { currentUserId: string; today: string; weekOut: string },
): DealRow[] {
  return deals
    .filter((d) => !filters.openOnly || d.status === "open")
    .filter((d) => !filters.myDealsOnly || d.ownerId === ctx.currentUserId)
    .filter((d) => {
      if (!filters.closingThisWeek) return true;
      return (
        d.expectedCloseDate !== null &&
        d.expectedCloseDate >= ctx.today &&
        d.expectedCloseDate <= ctx.weekOut
      );
    })
    .sort(compareDeals(sort.key, sort.direction));
}
