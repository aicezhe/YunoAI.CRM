/** Mirrors the dashboard's own proportions — one big block, one faint line
 *  underneath — so the hierarchy is legible before the data arrives. */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="skeleton h-10 w-56 rounded-lg" />
      <div className="skeleton-soft mt-3 h-4 w-40 rounded" />

      <div className="mt-8 rounded-3xl border border-brand-200/70 bg-white p-3 shadow-sm">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-1 py-3.5">
            <div className="skeleton h-8 w-8 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="skeleton h-4 w-2/5 rounded" />
              <div className="skeleton-soft mt-2 h-3 w-3/5 rounded" />
            </div>
            <div className="skeleton-soft h-3.5 w-10 rounded" />
            <div className="skeleton-soft h-6 w-6 rounded-lg" />
          </div>
        ))}
      </div>

      <div className="skeleton-soft mt-10 h-3.5 w-80 max-w-full rounded" />
    </div>
  );
}
