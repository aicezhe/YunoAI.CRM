import type { LucideIcon } from "lucide-react";

/**
 * The "nothing here yet" card. Every section renders one today, and each will
 * keep it for the genuinely-empty case once records can be created.
 *
 * The icon sits in a tinted brand circle rather than floating grey on white:
 * a lone outline glyph on an empty page reads as a broken image, a filled
 * medallion reads as deliberate.
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
