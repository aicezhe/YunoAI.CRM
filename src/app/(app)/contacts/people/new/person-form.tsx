"use client";

import { useActionState } from "react";
import { createPerson, type PersonFormState } from "@/lib/data/actions";
import { Field, FIELD_CLASS, FormActions, FORM_CARD_CLASS, SelectField } from "@/components/ui/form";
import type { OrganizationRow } from "@/lib/data/types";
import type { UserOption } from "@/lib/data/users";

export function PersonForm({
  organizations,
  users,
  currentUserId,
}: {
  organizations: OrganizationRow[];
  users: UserOption[];
  currentUserId: string;
}) {
  const initial: PersonFormState = {
    error: null,
    values: { name: "", orgId: "", email: "", phone: "", ownerId: currentUserId },
  };
  const [state, formAction, pending] = useActionState(createPerson, initial);
  const { values } = state;

  return (
    <form action={formAction} noValidate className={FORM_CARD_CLASS}>
      <Field id="name" label="Name">
        <input
          id="name"
          name="name"
          required
          defaultValue={values.name}
          placeholder="Maria Rossi"
          className={FIELD_CLASS}
        />
      </Field>

      {/* No organization is a real, permanent state here, not just an
          in-progress one — an individual buyer never needs to gain a
          company to become a "real" contact. */}
      <SelectField
        id="orgId"
        name="orgId"
        label="Organization"
        optional
        defaultValue={values.orgId}
        placeholder="No organization"
        options={organizations.map((o) => ({ value: o.id, label: o.name }))}
      />

      <Field id="email" label="Email" optional>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={values.email}
          placeholder="maria@example.com"
          className={FIELD_CLASS}
        />
      </Field>

      <Field id="phone" label="Phone" optional>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={values.phone}
          placeholder="+39 02 1234 5678"
          className={FIELD_CLASS}
        />
      </Field>

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
        cancelHref="/contacts/people"
        submitLabel="Add contact"
      />
    </form>
  );
}
