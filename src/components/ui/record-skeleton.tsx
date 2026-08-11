
/**
 * Placeholder for a record page.
 *
 * Its presence is what makes opening a record feel instant: without a
 * loading.tsx alongside the page, Next has nothing to show while the queries
 * run, so the click does nothing at all for as long as they take — which is
 * exactly how a fast app is made to feel slow.
 *
 * Shaped like the real page — back link, title, then cards of the right
 * height — and it arrives the way the real page does: heading first, each
 * card a beat behind on the same CARD_STAGGER_MS rhythm RecordCard uses. The
 * swap to content then reads as the grey version resolving into colour, not
 * one screen being replaced by another.
 */
/**
 * Field labels and values are never all the same length, and a column of
 * identical bars is what makes a skeleton read as a broken grid instead of
 * as text that hasn't arrived. Fixed values rather than Math.random(), which
 * would differ between the server render and the client's and hydrate
 * mismatched. */
const LABEL_W = ["w-20", "w-24", "w-16", "w-24", "w-20", "w-14"];
const VALUE_W = ["w-44", "w-32", "w-52", "w-28", "w-40", "w-36"];

export function RecordSkeleton({ cards = 2, rows = 4 }: { cards?: number; rows?: number }) {
  return (
    <div className="skeleton-screen mx-auto max-w-3xl">
      <div className="skeleton-soft h-3.5 w-24 rounded" />
      {/* Shorter and lighter than the h-9/w-72 slab this replaced: at the top
          of an otherwise empty page that block was the loudest thing on
          screen, and it is standing in for a heading, not shouting one. */}
      <div className="skeleton mt-5 h-7 w-56 max-w-full rounded-lg" />

      <div className="mt-8 space-y-6">
        {Array.from({ length: cards }).map((_, c) => (
          <div
            key={c}
            className="rounded-2xl border border-brand-200/70 bg-white p-7 shadow-card"
          >
            {Array.from({ length: rows }).map((_, r) => (
              <div
                key={r}
                className="flex items-center justify-between gap-8 border-b border-brand-200/40 py-3.5 last:border-0"
              >
                <div className={`skeleton-soft h-3 rounded ${LABEL_W[(c * rows + r) % LABEL_W.length]}`} />
                <div
                  className={`skeleton h-3 max-w-[45%] rounded ${VALUE_W[(c * rows + r) % VALUE_W.length]}`}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
