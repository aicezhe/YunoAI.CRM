"use client";

import { useActionState } from "react";
import { createOrganization, type OrganizationFormState } from "@/lib/data/actions";
import { Field, FIELD_CLASS, FormActions, FORM_CARD_CLASS, SelectField } from "@/components/ui/form";
import type { UserOption } from "@/lib/data/users";

export function OrganizationForm({
  users,
  currentUserId,
}: {
  users: UserOption[];
  currentUserId: string;
}) {
  const initial: OrganizationFormState = {
    error: null,
    values: { name: "", industry: "", address: "", website: "", ownerId: currentUserId },
  };
  const [state, formAction, pending] = useActionState(createOrganization, initial);
  const { values } = state;

  return (
    <form action={formAction} noValidate className={FORM_CARD_CLASS}>
      <Field id="name" label="Name">
        <input
          id="name"
          name="name"
          required
          defaultValue={values.name}
          placeholder="Acme Corporation"
          className={FIELD_CLASS}
        />
      </Field>

      <Field id="industry" label="Industry" optional>
        <input
          id="industry"
          name="industry"
          defaultValue={values.industry}
          placeholder="Manufacturing"
          className={FIELD_CLASS}
        />
      </Field>

      <Field id="address" label="Address" optional>
        <input
          id="address"
          name="address"
          defaultValue={values.address}
          placeholder="Via Roma 1, Milano"
          className={FIELD_CLASS}
        />
      </Field>

      <Field id="website" label="Website" optional>
        <input
          id="website"
          name="website"
          defaultValue={values.website}
          placeholder="example.com"
          className={FIELD_CLASS}
        />
      </Field>

      {/* Defaults to whoever is filling the form in — the common case is
          adding your own lead, not assigning someone else's on their
          behalf — but it stays a real picker, changeable in one click. */}
      <SelectField
        id="ownerId"
        name="ownerId"
        label="Owner"
        optional
        defaultValue={values.ownerId}
        placeholder="Unassigned"
        options={users.map((u) => ({ value: u.id, label: u.name }))}
      />

      <FormActions
        error={state.error}
        pending={pending}
        cancelHref="/contacts/organizations"
        submitLabel="Add organization"
      />
    </form>
  );
}
