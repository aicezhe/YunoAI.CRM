"use client";

import { useActionState } from "react";
import { type ActivityFormState, createActivity } from "@/lib/data/actions/activities";
import {
  Field,
  FIELD_CLASS,
  FormActions,
  FORM_CARD_CLASS,
  SelectField,
  UrgentCheckbox,
} from "@/components/ui/form";
import type { DealRow, OrganizationRow, PersonRow } from "@/lib/data/types";

const TYPES = [
  { value: "call", label: "Call" },
  { value: "meeting", label: "Meeting" },
  { value: "email", label: "Email" },
  { value: "task", label: "Task" },
  { value: "note", label: "Note" },
];

export function ActivityForm({
  deals,
  persons,
  organizations,
  prefill,
}: {
  deals: DealRow[];
  persons: PersonRow[];
  organizations: OrganizationRow[];
  /** Carried in from the record this was opened from. Initial value only —
   *  every picker stays editable. */
  prefill?: { personId?: string; orgId?: string; dealId?: string };
}) {
  const initial: ActivityFormState = {
    error: null,
    values: {
      type: "",
      subject: "",
      dealId: prefill?.dealId ?? "",
      personId: prefill?.personId ?? "",
      orgId: prefill?.orgId ?? "",
      dueAt: "",
      priority: "normal",
    },
  };
  const [state, formAction, pending] = useActionState(createActivity, initial);
  const { values } = state;

  return (
    <form action={formAction} noValidate className={FORM_CARD_CLASS}>
      <SelectField
        id="type"
        name="type"
        label="Type"
        required
        defaultValue={values.type}
        placeholder="Choose a type…"
        options={TYPES}
      />

      <Field id="subject" label="Subject">
        <input
          id="subject"
          name="subject"
          required
          defaultValue={values.subject}
          placeholder="Follow-up call about the proposal"
          className={FIELD_CLASS}
        />
      </Field>

      {/* Three independent, optional links rather than one field — the
          schema only requires at least one of the three (whichever fits:
          a call with no deal yet, a note on a deal with no named contact),
          and the form doesn't demand more than that. */}
      <SelectField
        id="dealId"
        name="dealId"
        label="Deal"
        optional
        defaultValue={values.dealId}
        placeholder="No deal"
        options={deals.map((d) => ({ value: d.id, label: d.title }))}
      />

      <SelectField
        id="personId"
        name="personId"
        label="Contact"
        optional
        defaultValue={values.personId}
        placeholder="No contact"
        options={persons.map((p) => ({ value: p.id, label: p.name }))}
      />

      <SelectField
        id="orgId"
        name="orgId"
        label="Organization"
        optional
        defaultValue={values.orgId}
        placeholder="No organization"
        options={organizations.map((o) => ({ value: o.id, label: o.name }))}
      />

      <Field id="dueAt" label="Due" optional>
        <input
          id="dueAt"
          name="dueAt"
          type="datetime-local"
          defaultValue={values.dueAt}
          className={FIELD_CLASS}
        />
        <p className="mt-1.5 text-xs text-gray-400">
          Leave blank to log something that already happened, like a note.
        </p>
      </Field>

      <UrgentCheckbox defaultChecked={values.priority === "urgent"} />

      <FormActions
        error={state.error}
        pending={pending}
        cancelHref="/activities/open"
        submitLabel="Add activity"
      />
    </form>
  );
}
