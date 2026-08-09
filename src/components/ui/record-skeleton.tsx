/**
 * Placeholder for a record page.
 *
 * Its presence is what makes opening a record feel instant: without a
 * loading.tsx alongside the page, Next has nothing to show while the queries
 * run, so the click does nothing at all for as long as they take — which is
 * exactly how a fast app is made to feel slow.
 *
 * Shaped like the real page — back link, title, then cards of the right
 * height — so the content lands in place instead of shoving the layout.
 */
export function RecordSkeleton({ cards = 2, rows = 4 }: { cards?: number; rows?: number }) {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      <div className="h-4 w-28 rounded bg-gray-200" />
      <div className="mt-5 h-9 w-72 max-w-full rounded-lg bg-gray-200" />

      <div className="mt-8 space-y-5">
        {Array.from({ length: cards }).map((_, c) => (
          <div
            key={c}
            className="rounded-3xl border border-brand-200/70 bg-white p-6 shadow-sm"
          >
            {Array.from({ length: rows }).map((_, r) => (
              <div
                key={r}
                className="flex items-center justify-between gap-8 border-b border-brand-200/40 py-3.5 last:border-0"
              >
                <div className="h-3.5 w-24 rounded bg-gray-100" />
                <div className="h-3.5 w-40 max-w-[45%] rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
