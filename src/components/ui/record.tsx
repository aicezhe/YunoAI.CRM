import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * Where BackLink should point when a record was opened from the dashboard's
 * task list rather than from its own list page — the dashboard has no
 * "Deals"/"People"/"Organizations" tab to return to, so the list-page
 * fallback would strand the user somewhere they never asked to go.
 *
 * Driven by a `?from=dashboard` query param rather than the browser's own
 * history, which is unavailable when the record was opened directly (a
 * fresh tab, a bookmark, a hard refresh) and unreliable to branch rendering
 * on even when it is there.
 */
export function resolveBack(
  from: string | string[] | undefined,
  fallback: { href: string; label: string },
): { href: string; label: string } {
  return from === "dashboard" ? { href: "/dashboard", label: "Dashboard" } : fallback;
}

/** Back to the list the row was clicked from — or, per resolveBack above,
 *  to the dashboard when that is where the click came from. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-brand-600"
    >
      <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
      {label}
    </Link>
  );
}

/** A labelled value inside a record card. Absent values still render, so the
 *  card shows what is missing rather than quietly omitting the row. */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-brand-200/40 py-3 last:border-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{children}</dd>
    </div>
  );
}

/** Fixed step between a record page's cards — see the comment on RecordCard.
 *  Exported so a page can offset its own non-card elements (e.g. the
 *  context line under a dashboard's task lists) onto the same beat instead
 *  of picking an unrelated number. */
export const CARD_STAGGER_MS = 90;

/**
 * A record page's card sections settle in one after another rather than
 * appearing at once — the heading arrives first (delay 0, animated
 * separately at each call site), then each card a beat behind it, leading
 * the eye down the page in reading order. Pass `index` (0 for the first
 * card, 1 for the second, …) to opt in; the delay is `(index + 1) *
 * CARD_STAGGER_MS`, one step past the heading's own delay of 0, so the
 * first card visibly follows the heading rather than arriving with it.
 *
 * A flat step rather than the count-aware budget `staggerDelayMs` gives
 * table rows: that budget exists so a thirty-row table doesn't take
 * noticeably longer to finish revealing than a three-row one, but a record
 * page only ever has two or three cards, so there is no long-list case to
 * protect against — a fixed, clearly-felt gap is simply the better fit.
 */
export function RecordCard({
  title,
  children,
  index,
}: {
  title?: string;
  children: React.ReactNode;
  index?: number;
}) {
  const animated = index !== undefined;
  return (
    <section
      className={
        "rounded-3xl border border-brand-200/70 bg-white p-6 shadow-sm" + (animated ? " enter" : "")
      }
      style={
        animated
          ? ({ "--enter-delay": `${(index + 1) * CARD_STAGGER_MS}ms` } as React.CSSProperties)
          : undefined
      }
    >
      {title && <h2 className="mb-2 text-base font-semibold text-gray-900">{title}</h2>}
      {children}
    </section>
  );
}

export function Missing() {
  return <span className="font-normal text-gray-300">—</span>;
}
