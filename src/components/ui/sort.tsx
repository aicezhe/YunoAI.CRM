"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

export type SortDirection = "asc" | "desc";

/**
 * A sortable column heading. Lives here rather than beside one list because
 * both Deals and Activities sort, and two copies of the same control drift
 * apart the first time one of them is adjusted.
 */
export function SortHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  const Arrow = direction === "asc" ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold tracking-wide text-gray-500 uppercase transition-colors hover:text-brand-600"
    >
      {label}
      {active && <Arrow className="h-3 w-3 text-brand-500" strokeWidth={2.5} aria-hidden />}
    </button>
  );
}

/** The card list's own sort trigger — same pill shape as the filter chips
 *  (active = filled) so the two read as one control language, plus the
 *  direction arrow SortHeader shows on desktop. md:hidden: above md the
 *  table's own column headers do this job, and a second control for the same
 *  thing would just be clutter there. */
export function SortPill({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  const Arrow = direction === "asc" ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors md:hidden " +
        (active
          ? "bg-brand-500 text-white shadow-sm shadow-brand-500/25"
          : "border border-brand-200/70 bg-white text-gray-600 hover:bg-brand-100/60")
      }
    >
      {label}
      {active && <Arrow className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />}
    </button>
  );
}
