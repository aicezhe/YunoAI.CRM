/**
 * Italian formatting throughout: this is a CRM for an Italian pipeline, and
 * the demo values are euros. it-IT gives "€ 45.000" and "9 ago" — thousands
 * separated by dots, which is what the numbers in the brief look like.
 */
// Italian grouping (dots for thousands) with the symbol in front: "€45.000".
// `style: "currency"` on it-IT would put it after the number instead, which
// is correct Italian but not the notation this app was specified in.
// useGrouping "always": Italian defaults to "min2", which leaves four-digit
// numbers ungrouped — so a column would mix "€9800" and "€46.000" and the
// two would not line up as the same magnitude at a glance.
const AMOUNT = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 0,
  useGrouping: "always",
});
const MONEY = { format: (n: number) => `€${AMOUNT.format(n)}` };

// Dates in English, unlike the numbers: the interface is English, and it-IT
// month abbreviations read as words that mean something else here — "1 ago"
// is the 1st of August, not "one ago".
const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const DAY_YEAR = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

export function formatMoney(value: number | null, currency: string | null = "EUR"): string {
  if (value === null) return "—";
  // Anything other than euro keeps the ISO code rather than guessing a
  // symbol — a pipeline can hold more than one currency, and "USD 12.000" is
  // unambiguous where a bare $ next to euro rows is not.
  if (currency && currency !== "EUR") return `${currency} ${AMOUNT.format(value)}`;
  return MONEY.format(value);
}

/** Date-only columns (expected close, signed date). Year shown only when it
 *  is not the current one — it is noise on the 90% of rows that are. */
export function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return (sameYear ? DAY : DAY_YEAR).format(d);
}

export function formatTime(value: string): string {
  return TIME.format(new Date(value));
}

/**
 * Due timestamps in lists.
 *
 * Today is named rather than left implicit. The first cut printed the bare
 * time — "14:30" — on the theory that a date is noise when it is obviously
 * now; that was wrong the moment the column became sortable. In a list
 * ordered by date, a row reading "09:30" sitting between "11 Aug" and
 * "14 Aug" looks misplaced, and the reader has no way to tell it is not:
 * nothing on the row says which day it belongs to.
 *
 * "Today" keeps the signal the bare time was after — it is still the most
 * prominent thing you can say about a due date — while putting the row back
 * in a readable order.
 */
export function formatDue(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  return isToday ? `Today, ${TIME.format(d)}` : `${formatDate(value)}, ${TIME.format(d)}`;
}

/** "yesterday" / "3 days ago" for the overdue strip, naming the moment
 *  something was due rather than measuring the delay since. */
export function formatRelativeDay(value: string): string {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days < 1) return "earlier today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}
