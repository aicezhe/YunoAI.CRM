"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { setActivityDone } from "@/lib/data/actions";

/**
 * Ticks an activity off in place.
 *
 * Optimistic: the tick lands immediately and the round-trip happens behind
 * it. Clearing today's list is a rapid, repetitive action, and waiting on the
 * server for each one makes the list feel stuck — the user is already on to
 * the next row. If the action rejects, React discards the optimistic value
 * and the box springs back on its own.
 *
 * z-10 keeps it above the row's stretched link, so ticking a row does not
 * also navigate away from it.
 */
export function DoneCheckbox({
  id,
  done,
  label,
}: {
  id: string;
  done: boolean;
  /** Named for screen readers, which otherwise announce a bare checkbox. */
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  const [optimisticDone, setOptimisticDone] = useOptimistic(done);

  function toggle() {
    startTransition(async () => {
      setOptimisticDone(!optimisticDone);
      await setActivityDone(id, !optimisticDone);
    });
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={optimisticDone}
      aria-label={`Mark "${label}" as done`}
      onClick={toggle}
      disabled={pending}
      className={
        "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors duration-150 ease-out " +
        (optimisticDone
          ? "border-brand-500 bg-brand-500 text-white"
          : "border-gray-300 bg-white text-transparent hover:border-brand-500")
      }
    >
      {/* The tick pops in rather than tinting in: scale-50→100 alongside the
          colour change reads as the mark being placed, not the box merely
          changing shade. */}
      <Check
        className={
          "h-3.5 w-3.5 transition-transform duration-150 ease-out " +
          (optimisticDone ? "scale-100" : "scale-50")
        }
        strokeWidth={3}
        aria-hidden
      />
    </button>
  );
}
