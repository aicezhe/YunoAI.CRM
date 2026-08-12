"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { deleteOrganization, deletePerson } from "@/lib/data/actions/contacts";
import type { DeleteImpact } from "@/lib/data/types";

/**
 * Deletes a contact record, behind an inline confirmation that states what
 * the delete will actually do.
 *
 * Two steps and inline rather than a modal, matching ClearArchiveButton —
 * the consequence is rendered right where the button that causes it is.
 *
 * The confirmation is built from real counts, not generic warning copy,
 * because the three outcomes here are genuinely different:
 *   · deals > 0    — refused outright. deals.org_id/person_id are ON DELETE
 *                    RESTRICT, so the database would reject this anyway;
 *                    saying so up front beats a failed click.
 *   · people > 0   — allowed. persons.org_id is ON DELETE SET NULL: the
 *                    contacts survive, unattached (0005_persons.sql).
 *   · activities   — allowed, link cleared, history kept.
 */
export function DeleteRecordButton({
  kind,
  id,
  name,
  impact,
}: {
  kind: "organization" | "person";
  id: string;
  name: string;
  impact: DeleteImpact;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const blocked = impact.deals > 0;
  const noun = kind === "organization" ? "organization" : "contact";

  function remove() {
    setError(null);
    startTransition(async () => {
      // On success the action redirects, so nothing after this runs; only a
      // refusal or a failure comes back with a message.
      const result =
        kind === "organization" ? await deleteOrganization(id) : await deletePerson(id);
      if (result?.error) setError(result.error);
    });
  }

  // AnimatePresence with mode="wait", so Cancel actually plays the panel's
  // exit before the plain button returns — an early-return swap here would
  // unmount it mid-frame, which reads as the panel snapping shut. `initial=
  // {false}` keeps the button from animating in on first page load.
  return (
    <AnimatePresence mode="wait" initial={false}>
      {!confirming ? (
        <motion.button
          key="trigger"
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          onClick={() => setConfirming(true)}
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          Delete
        </motion.button>
      ) : (
        <motion.div
          key="panel"
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.1, ease: "easeIn" } }}
          transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
          className="w-full rounded-2xl border border-rose-200 bg-rose-50/60 p-4"
        >
          {blocked ? (
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{name}</span> is on{" "}
              {impact.deals === 1 ? "1 deal" : `${impact.deals} deals`} and can&apos;t be deleted.
              Reassign or delete {impact.deals === 1 ? "that deal" : "those deals"} first.
            </p>
          ) : (
            <p className="text-sm text-gray-700">
              Delete <span className="font-semibold">{name}</span>? This cannot be undone.
              <Consequences kind={kind} impact={impact} />
            </p>
          )}

          {error && (
            <p role="alert" className="mt-2 text-sm font-medium text-rose-600">
              {error}
            </p>
          )}

          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
              disabled={pending}
              className="min-h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
            >
              {blocked ? "Close" : "Cancel"}
            </button>

            {!blocked && (
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending && (
                  <span
                    aria-hidden
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  />
                )}
                {pending ? "Deleting…" : `Delete ${noun}`}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * What survives and what does not — so "cannot be undone" doesn't read as
 * though the attached people and logged calls go too, and, just as
 * importantly, so the ones that *do* go are named.
 *
 * Activities split into two outcomes since 0017: those linked to something
 * else survive with the link cleared, those linked only to this record are
 * deleted with it. Stating one number for both would make the confirmation
 * a half-truth in whichever direction it rounded.
 */
function Consequences({ kind, impact }: { kind: "organization" | "person"; impact: DeleteImpact }) {
  const parts: string[] = [];

  if (kind === "organization" && impact.people > 0) {
    parts.push(
      `${impact.people === 1 ? "1 contact" : `${impact.people} contacts`} will stay, without a company`,
    );
  }
  if (impact.activities > 0) {
    parts.push(
      `${impact.activities === 1 ? "1 activity" : `${impact.activities} activities`} will keep ${impact.activities === 1 ? "its" : "their"} history, without the link`,
    );
  }
  if (parts.length === 0 && impact.activitiesDeleted === 0) return null;

  return (
    <>
      {parts.length > 0 && <span className="mt-1 block text-gray-500">{parts.join("; ")}.</span>}
      {impact.activitiesDeleted > 0 && (
        <span className="mt-1 block font-medium text-rose-700">
          {impact.activitiesDeleted === 1
            ? "1 activity is linked to nothing else and will be deleted too."
            : `${impact.activitiesDeleted} activities are linked to nothing else and will be deleted too.`}
        </span>
      )}
    </>
  );
}
