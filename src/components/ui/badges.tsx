import { Check, Mail, Phone, StickyNote, Users, X, type LucideIcon } from "lucide-react";
import type { ActivityType, DealStatus } from "@/lib/data/types";

/**
 * Pipeline stage. One neutral lavender chip for every stage rather than a
 * colour per stage: seven colours in a table column turns the list into a
 * rainbow and stops the eye finding anything. Won and lost do not appear
 * here — they are a status, not a place in the pipeline, and get StatusBadge.
 */
export function StageBadge({ name }: { name: string | null }) {
  if (!name) return <span className="text-gray-300">—</span>;
  return (
    <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-600">
      {name}
    </span>
  );
}

/** Closed deals. The only place colour carries meaning in the table, which is
 *  what keeps it readable. */
export function StatusBadge({ status }: { status: DealStatus }) {
  if (status === "won") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
        Won
      </span>
    );
  }
  if (status === "lost") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
        <X className="h-3 w-3" strokeWidth={2.5} aria-hidden />
        Lost
      </span>
    );
  }
  return <span className="text-xs text-gray-500">Open</span>;
}

const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  call: Phone,
  meeting: Users,
  email: Mail,
  task: Check,
  note: StickyNote,
};

/** Activity kind as an icon in a tinted square — the type column is scanned,
 *  not read, so a shape beats a word at small sizes. */
export function ActivityIcon({ type, className = "" }: { type: ActivityType; className?: string }) {
  const Icon = ACTIVITY_ICONS[type];
  return (
    <span
      title={type}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-500 ${className}`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      <span className="sr-only">{type}</span>
    </span>
  );
}
