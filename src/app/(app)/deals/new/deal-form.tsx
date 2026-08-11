"use client";

import { useActionState } from "react";
import { type DealFormState, createDeal } from "@/lib/data/actions/deals";
import {
  Field,
  FIELD_CLASS,
  FormActions,
  FORM_CARD_CLASS,
  OwnerField,
  SelectField,
} from "@/components/ui/form";
import type { OrganizationRow, PersonRow } from "@/lib/data/types";
import type { StageOption } from "@/lib/data/deals";
import type { UserOption } from "@/lib/data/users";

export function DealForm({
  organizations,
  persons,
  stages,
  users,
  currentUserId,
  prefill,
}: {
  organizations: OrganizationRow[];
  persons: PersonRow[];
  stages: StageOption[];
  users: UserOption[];
  currentUserId: string;
  /** Counterparty carried in from wherever this was opened — the "Add deal"
   *  button on a contact's or a company's record. Only the initial value;
   *  both pickers stay editable. */
  prefill?: { orgId?: string; personId?: string };
}) {
  const initial: DealFormState = {
    error: null,
    values: {
      title: "",
      orgId: prefill?.orgId ?? "",
      personId: prefill?.personId ?? "",
      // The board's first column — see the comment on createDeal for why a
      // real default beats leaving this at "no stage".
      stageId: stages[0]?.id ?? "",
      value: "",
      expectedCloseDate: "",
      ownerId: currentUserId,
    },
  };
  const [state, formAction, pending] = useActionState(createDeal, initial);
  const { values } = state;

  return (
    <form action={formAction} noValidate className={FORM_CARD_CLASS}>
      <Field id="title" label="Title">
        <input
          id="title"
          name="title"
          required
          defaultValue={values.title}
          placeholder="New website for Acme"
          className={FIELD_CLASS}
        />
      </Field>

      {/* Two independent pickers, not one combined "counterparty" field — a
          deal can have an organization, a person, or both (see how the deals
          list shows the person under the org when there's both). The schema
          only demands at least one; the form doesn't ask for more than that. */}
      <SelectField
        id="orgId"
        name="orgId"
        label="Organization"
        optional
        defaultValue={values.orgId}
        placeholder="No organization"
        options={organizations.map((o) => ({ value: o.id, label: o.name }))}
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
        id="stageId"
        name="stageId"
        label="Stage"
        optional
        defaultValue={values.stageId}
        placeholder="No stage"
        options={stages.map((s) => ({ value: s.id, label: s.name }))}
      />

      <Field id="value" label="Value" optional>
        <input
          id="value"
          name="value"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          placeholder="0.00"
          defaultValue={values.value}
          className={FIELD_CLASS}
        />
      </Field>

      <Field id="expectedCloseDate" label="Expected close" optional>
        <input
          id="expectedCloseDate"
          name="expectedCloseDate"
          type="date"
          defaultValue={values.expectedCloseDate}
          className={FIELD_CLASS}
        />
      </Field>

      {/* Fixed: this form only ever creates, and a deal is owned by whoever
          entered it. Reassignment is not lost — see the deal's own record. */}
      <OwnerField users={users} defaultValue={values.ownerId} editable={false} />

      <FormActions error={state.error} pending={pending} cancelHref="/deals" submitLabel="Add deal" />
    </form>
  );
}
