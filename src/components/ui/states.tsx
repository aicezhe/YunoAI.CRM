import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";

/**
 * "Nothing here yet" — for a list that loaded fine and is genuinely empty.
 *
 * Distinct from ErrorState on purpose: an empty list and a failed one look
 * identical if both just show a blank card, and the two need opposite
 * reactions from the user. This one leads with the action that fills it.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-brand-200/70 bg-white px-6 py-16 text-center shadow-sm">
      <span className="rise-in flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-500">
        <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
      </span>
      <h2 className="mt-5 text-base font-semibold text-gray-900">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-gray-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/**
 * The query failed. Amber rather than the brand colour — the palette's job
 * here is to say "this is not normal", which lavender cannot do when it is
 * also the colour of every button on the screen.
 */
export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-amber-200 bg-amber-50/60 px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
        <AlertTriangle className="h-6 w-6" strokeWidth={1.75} aria-hidden />
      </span>
      <h2 className="mt-5 text-base font-semibold text-gray-900">Something went wrong</h2>
      <p className="mt-1.5 max-w-sm text-sm text-gray-600">{message}</p>
    </div>
  );
}

/** Table skeleton. Mirrors the real table's card, header band and row height
 *  so the layout does not jump when the data lands. */
export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-brand-200/70 bg-white shadow-sm">
      <div className="flex gap-6 border-b border-brand-200/70 px-5 py-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="skeleton h-3 flex-1 rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-6 border-b border-brand-200/40 px-5 py-4 last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <div
              key={c}
              className={`h-3.5 flex-1 rounded ${c === 0 ? "skeleton" : "skeleton-soft"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Header skeleton — title plus the action button's footprint. */
export function HeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="skeleton h-8 w-44 rounded-lg" />
        <div className="skeleton-soft mt-3 h-3.5 w-64 max-w-full rounded" />
      </div>
      <div className="skeleton h-11 w-40 rounded-2xl" />
    </div>
  );
}
