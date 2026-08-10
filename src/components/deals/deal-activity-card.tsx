"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DoneCheckbox } from "@/components/done-checkbox";
import { ActivityIcon } from "@/components/ui/badges";
import { Field, FIELD_CLASS, SelectField } from "@/components/ui/form";
import { RecordCard } from "@/components/ui/record";
import { createDealActivity, type DealActivityFormState } from "@/lib/data/actions";
import type { ActivityRow, Result } from "@/lib/data/types";
import { formatDue } from "@/lib/format";

const TYPES = [
  { value: "call", label: "Call" },
  { value: "meeting", label: "Meeting" },
  { value: "email", label: "Email" },
  { value: "task", label: "Task" },
  { value: "note", label: "Note" },
];

/**
 * The deal page's Activity card, with the one thing it was missing: a way to
 * log something without leaving the page. The list itself is still server
 * data passed in as a prop — after a save, createDealActivity's
 * revalidatePath plus Next's own re-render of the current route brings a
 * fresh `activities` prop with the new row already in it, so this never
 * needs to track the list itself as local state.
 */
export function DealActivityCard({
  dealId,
  personId,
  orgId,
  activities,
}: {
  dealId: string;
  personId: string | null;
  orgId: string | null;
  activities: Result<ActivityRow[]>;
}) {
  const [open, setOpen] = useState(false);
  // Bumped on every close-after-save, so reopening mounts a fresh
  // useActionState instead of showing the just-submitted values and done:true.
  const [formKey, setFormKey] = useState(0);

  return (
    <RecordCard
      index={1}
      title="Activity"
      action={
        !open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-600 transition hover:bg-brand-100"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            Add activity
          </button>
        )
      }
    >
      {open && (
        <MiniForm
          key={formKey}
          dealId={dealId}
          personId={personId}
          orgId={orgId}
          onCancel={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            setFormKey((k) => k + 1);
          }}
        />
      )}

      {!activities.ok ? (
        <p className="py-4 text-sm text-gray-500">{activities.error}</p>
      ) : activities.data.length === 0 ? (
        <p className="py-4 text-sm text-gray-500">Nothing logged against this deal yet.</p>
      ) : (
        <ul className="mt-2 divide-y divide-brand-200/40">
          {activities.data.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-3">
              <ActivityIcon type={a.type} />
              <div className="min-w-0 flex-1">
                <p
                  className={
                    "truncate text-sm " + (a.done ? "text-gray-400 line-through" : "text-gray-900")
                  }
                >
                  {a.subject}
                </p>
                <p className="text-xs text-gray-400">{formatDue(a.dueAt)}</p>
              </div>
              <DoneCheckbox id={a.id} done={a.done} label={a.subject} />
            </li>
          ))}
        </ul>
      )}
    </RecordCard>
  );
}

function MiniForm({
  dealId,
  personId,
  orgId,
  onCancel,
  onSaved,
}: {
  dealId: string;
  personId: string | null;
  orgId: string | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const initial: DealActivityFormState = {
    error: null,
    done: false,
    values: { type: "", subject: "", dealId, personId: personId ?? "", orgId: orgId ?? "", dueAt: "" },
  };
  const [state, formAction, pending] = useActionState(createDealActivity, initial);

  useEffect(() => {
    if (state.done) onSaved();
  }, [state.done, onSaved]);

  return (
    <form
      action={formAction}
      noValidate
      className="mb-4 space-y-3 rounded-2xl border border-brand-200/60 bg-brand-50/30 p-4"
    >
      {/* Deal/contact/org are this deal's own — fixed, not chosen, unlike the
          standalone Add Activity form. */}
      <input type="hidden" name="dealId" value={dealId} />
      <input type="hidden" name="personId" value={personId ?? ""} />
      <input type="hidden" name="orgId" value={orgId ?? ""} />

      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          id="deal-activity-type"
          name="type"
          label="Type"
          required
          defaultValue={state.values.type}
          placeholder="Choose a type…"
          options={TYPES}
        />
        <Field id="deal-activity-due" label="Due" optional>
          <input
            id="deal-activity-due"
            name="dueAt"
            type="datetime-local"
            defaultValue={state.values.dueAt}
            className={FIELD_CLASS}
          />
        </Field>
      </div>

      <Field id="deal-activity-subject" label="Subject">
        <input
          id="deal-activity-subject"
          name="subject"
          required
          defaultValue={state.values.subject}
          placeholder="Follow-up call about the proposal"
          className={FIELD_CLASS}
        />
      </Field>

      {state.error && (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-9 items-center rounded-xl px-3 text-sm font-medium text-gray-500 transition hover:bg-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-9 items-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
