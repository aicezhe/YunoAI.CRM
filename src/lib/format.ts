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

/** Due timestamps in lists: the time alone once it is today, the date
 *  otherwise — a bare "14:30" on a row three weeks out reads as urgent. */
export function formatDue(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  return isToday ? TIME.format(d) : `${formatDate(value)}, ${TIME.format(d)}`;
}

/** "2 days ago" for the overdue block, where how late something is matters
 *  more than the timestamp it was due at. */
export function formatOverdueBy(value: string): string {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days < 1) return "earlier today";
  if (days === 1) return "1 day late";
  return `${days} days late`;
}
