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
    <div className="flex flex-col items-center justify-center rounded-3xl border border-brand-200/70 bg-white px-6 py-16 text-center shadow-card">
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
 * The small empty block *inside* a record card — "Nothing logged against
 * this deal yet", "No stage changes recorded yet".
 *
 * Distinct from EmptyState, which owns a whole screen and is a card in its
 * own right. This one sits in a card that already exists, so it stays low
 * and quiet: a tinted icon, the line of text, and — when there is something
 * to do about it — one soft link. A bare sentence in the middle of an empty
 * card reads like a rendering failure; a sentence with an icon and a next
 * step reads as a state.
 */
export function InlineEmpty({
  icon: Icon,
  title,
  action,
}: {
  icon: LucideIcon;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <span className="rise-in flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100/70 text-brand-500">
        <Icon className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />
      </span>
      <p className="mt-3 text-sm text-gray-500">{title}</p>
      {action && <div className="mt-2">{action}</div>}
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

/** Table skeleton — desktop bars in a table-shaped card, mobile bars in
 *  separate card shells, matching whichever of the two real layouts
 *  (Table vs. Card/CardLink) is about to take its place. */
export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-3xl border border-brand-200/70 bg-white shadow-card md:block">
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

      <div className="space-y-3 md:hidden">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="rounded-2xl border border-brand-200/70 bg-white p-4 shadow-card">
            <div className="skeleton h-4 w-2/3 rounded" />
            <div className="skeleton-soft mt-2.5 h-3 w-2/5 rounded" />
            <div className="skeleton-soft mt-3 h-3 w-1/3 rounded" />
          </div>
        ))}
      </div>
    </>
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
