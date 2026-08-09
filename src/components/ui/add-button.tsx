import Link from "next/link";
import { Plus } from "lucide-react";

/**
 * The primary action on a list screen, and on its empty state.
 *
 * Disabled by default: most sections' create forms haven't shipped yet, and
 * a prominent button that leads to a dead route is worse than one that says
 * plainly it isn't wired up. Passing `href` switches it to a real link, at
 * the same shape and weight, for the sections that do have a form — nothing
 * shifts visually when a section's button goes live.
 */
export function AddButton({
  label,
  size = "default",
  href,
}: {
  label: string;
  /** "large" for the empty state, where this is the only thing to do. */
  size?: "default" | "large";
  href?: string;
}) {
  const sizing = size === "large" ? "min-h-12 px-6 text-sm" : "min-h-11 px-4 text-sm";
  const shared = `inline-flex shrink-0 items-center gap-2 rounded-2xl bg-brand-500 font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600 ${sizing}`;
  const icon = <Plus className={size === "large" ? "h-5 w-5" : "h-4 w-4"} strokeWidth={2.25} aria-hidden />;

  if (href) {
    return (
      <Link href={href} className={shared}>
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <button type="button" disabled className={`${shared} disabled:cursor-not-allowed disabled:opacity-55`}>
      {icon}
      {label}
    </button>
  );
}
