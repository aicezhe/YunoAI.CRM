"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { clearActivityArchive } from "@/lib/data/actions";

/**
 * Empties the archive, behind an inline confirmation.
 *
 * Two steps rather than one, because the delete is permanent and affects the
 * whole team. Inline rather than a modal: the second step replaces the button
 * in place, so the count being destroyed is right next to the button that
 * destroys it, and dismissing it is a click on Cancel rather than hunting for
 * an overlay's close control.
 *
 * The confirmation names the number. "Clear archive" is abstract; "delete 6
 * completed activities" is the actual consequence.
 */
export function ClearArchiveButton({ count }: { count: number }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function clear() {
    setError(null);
    startTransition(async () => {
      try {
        await clearActivityArchive();
        setConfirming(false);
      } catch {
        // The action logs the real cause; the user gets something they can
        // act on, and the confirmation stays open so they can retry.
        setError("Couldn't clear the archive. Try again.");
      }
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        Clear archive
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <p className="text-sm text-gray-600">
        Delete {count} completed {count === 1 ? "activity" : "activities"}? This cannot be undone.
      </p>

      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="min-h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={clear}
        disabled={pending}
        className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && (
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
        )}
        {pending ? "Deleting…" : "Delete"}
      </button>

      {error && (
        <p role="alert" className="w-full text-right text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
