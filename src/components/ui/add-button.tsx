import { Plus } from "lucide-react";

/**
 * The primary action on a list screen, and on its empty state.
 *
 * Rendered but disabled: the create forms are the next step, and a prominent
 * button that leads to a dead route is worse than one that says plainly it is
 * not wired yet. The `title` carries that, and the shape and weight are the
 * final ones, so nothing shifts when it goes live.
 */
export function AddButton({
  label,
  size = "default",
}: {
  label: string;
  /** "large" for the empty state, where this is the only thing to do. */
  size?: "default" | "large";
}) {
  const sizing =
    size === "large" ? "min-h-12 px-6 text-sm" : "min-h-11 px-4 text-sm";

  return (
    <button
      type="button"
      disabled
      title="Forms arrive in the next step"
      className={`inline-flex shrink-0 items-center gap-2 rounded-2xl bg-brand-500 font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-55 ${sizing}`}
    >
      <Plus className={size === "large" ? "h-5 w-5" : "h-4 w-4"} strokeWidth={2.25} aria-hidden />
      {label}
    </button>
  );
}
