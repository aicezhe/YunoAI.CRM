import { CARD_STAGGER_MS } from "@/components/ui/record";

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
export function RecordSkeleton({ cards = 2, rows = 4 }: { cards?: number; rows?: number }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="enter skeleton h-4 w-28 rounded" />
      <div
        className="enter skeleton mt-5 h-9 w-72 max-w-full rounded-lg"
        style={{ "--enter-delay": `${CARD_STAGGER_MS / 2}ms` } as React.CSSProperties}
      />

      <div className="mt-8 space-y-6">
        {Array.from({ length: cards }).map((_, c) => (
          <div
            key={c}
            className="enter rounded-2xl border border-brand-200/70 bg-white p-7 shadow-card"
            style={{ "--enter-delay": `${(c + 1) * CARD_STAGGER_MS}ms` } as React.CSSProperties}
          >
            {Array.from({ length: rows }).map((_, r) => (
              <div
                key={r}
                className="flex items-center justify-between gap-8 border-b border-brand-200/40 py-3.5 last:border-0"
              >
                <div className="skeleton-soft h-3.5 w-24 rounded" />
                <div className="skeleton h-3.5 w-40 max-w-[45%] rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
