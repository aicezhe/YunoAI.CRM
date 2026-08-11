"use client";

import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { useState, type ReactNode } from "react";

/** Same field treatment across every form in the app — text/date/number
 *  inputs and selects alike, so a new form matches the others by using this
 *  constant rather than re-deriving the look. */
export const FIELD_CLASS =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15";

export const FORM_CARD_CLASS =
  "space-y-5 rounded-2xl border border-brand-200/70 bg-white p-7 shadow-card";

export function Field({
  id,
  label,
  optional,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label} {optional && <span className="font-normal text-gray-400">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

/**
 * A controlled `<select>` — every select on every create form uses this
 * rather than a plain `defaultValue`-based one.
 *
 * The reason: React re-walks a select's options on every render of the
 * component that owns it and reasserts whatever value it had at mount,
 * unlike a plain `<input>`, where an uncontrolled value is genuinely left
 * alone after the first render. Found on the contract form — after a failed
 * submission re-rendered it, a picked deal silently reverted to the
 * placeholder even though `defaultValue` was fed the just-submitted id.
 * Confirmed by hand, with native browser events, that date/number/text
 * fields survive a failed round trip untouched and only the select did not.
 * Fixing it once here means the next form doesn't rediscover the same bug.
 */
export function SelectField({
  id,
  name,
  label,
  defaultValue,
  required,
  optional,
  options,
  placeholder,
  onValueChange,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  required?: boolean;
  optional?: boolean;
  options: { value: string; label: string }[];
  /** The first, unselectable option — for fields with no sensible default of
   *  their own (an owner, a counterparty). A field that defaults to a real
   *  choice (a deal's stage, defaulted to the first one) has no need for
   *  one; the true default is just the first entry in `options`. */
  placeholder?: string;
  /** For the rare field another part of the form has to react to — the deal
   *  form reveals its "reason for losing" input the moment Lost is picked.
   *  The select stays in charge of its own value; this only reports it. */
  onValueChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <Field id={id} label={label} optional={optional}>
      <select
        id={id}
        name={name}
        required={required}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onValueChange?.(e.target.value);
        }}
        className={FIELD_CLASS}
      >
        {placeholder && (
          <option value="" disabled={required}>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/**
 * "Mark as urgent" — the one control that sets activities.priority.
 *
 * A checkbox rather than a normal/urgent select: the default is overwhelmingly
 * the common case, and a two-option dropdown asks every person creating an
 * activity to make a choice they mostly don't have. Unchecked submits nothing,
 * which the action reads as "normal" (see insertActivity).
 *
 * `defaultChecked` rather than controlled state: unlike a `<select>`, a
 * checkbox keeps its DOM value across an unrelated re-render, so the failed-
 * round-trip bug that forced SelectField to be controlled does not apply.
 */
export function UrgentCheckbox({ id = "priority", defaultChecked }: { id?: string; defaultChecked?: boolean }) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-200/70 bg-brand-50/40 px-4 py-3 transition-colors hover:bg-brand-50"
    >
      <input
        id={id}
        name="priority"
        type="checkbox"
        value="urgent"
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand-500"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
          <CircleAlert className="h-4 w-4 fill-amber-400 text-white" strokeWidth={2.25} aria-hidden />
          Mark as urgent
        </span>
        <span className="mt-0.5 block text-xs text-gray-500">
          Urgent activities are flagged and sort above the rest in the open list.
        </span>
      </span>
    </label>
  );
}

/** The Cancel/Submit row and the reserved-height error line, identical on
 *  every create form. */
export function FormActions({
  error,
  pending,
  cancelHref,
  submitLabel,
  savingLabel = "Saving…",
}: {
  error: string | null;
  pending: boolean;
  cancelHref: string;
  submitLabel: string;
  savingLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
      {/* Reserves its line whether or not there's a message, so the form
          doesn't jump when an error appears. */}
      <p
        role="alert"
        aria-live="polite"
        className={`min-h-5 flex-1 text-sm text-red-500 ${error ? "" : "invisible"}`}
      >
        {error ?? " "}
      </p>

      <Link
        href={cancelHref}
        className="inline-flex min-h-11 items-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
      >
        Cancel
      </Link>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && (
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
        )}
        {pending ? savingLabel : submitLabel}
      </button>
    </div>
  );
}

/**
 * The Owner row.
 *
 * Two shapes on purpose. Creating a record: whoever is adding it owns it, so
 * this states who that will be and offers nothing to decide — the choice was
 * never interesting at that moment, and a select there is one more thing to
 * read past on the way to saving. Editing: a real picker, because handing a
 * record to a colleague is a thing people genuinely need to do.
 *
 * The fixed shape posts nothing. The create actions read the owner from the
 * session, so there is no hidden input to forge and no disabled field whose
 * value the browser would drop anyway.
 */
export function OwnerField({
  users,
  defaultValue,
  editable,
}: {
  users: { id: string; name: string }[];
  defaultValue: string;
  /** True on an edit form. */
  editable: boolean;
}) {
  if (editable) {
    return (
      <SelectField
        id="ownerId"
        name="ownerId"
        label="Owner"
        optional
        defaultValue={defaultValue}
        placeholder="Unassigned"
        options={users.map((u) => ({ value: u.id, label: u.name }))}
      />
    );
  }

  const owner = users.find((u) => u.id === defaultValue);

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">Owner</span>
      {/* Styled as a field so the form keeps its rhythm, but plainly inert:
          no border, no white surface, so it does not invite a click that
          would do nothing. */}
      <p className="px-1 py-2.5 text-sm text-gray-900">
        {owner?.name ?? "You"}
        <span className="ml-2 text-gray-400">— you, as the one adding it</span>
      </p>
    </div>
  );
}
