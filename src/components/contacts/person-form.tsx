"use client";

import { useActionState } from "react";
import { type PersonFormState, createPerson, updatePerson } from "@/lib/data/actions/contacts";
import { Field, FIELD_CLASS, FormActions, FORM_CARD_CLASS, SelectField } from "@/components/ui/form";
import type { OrganizationRow, PersonRow } from "@/lib/data/types";
import type { UserOption } from "@/lib/data/users";

/**
 * Shared by "Add contact" and "Edit contact" — the fields, their validation
 * and their layout are identical, and the only real difference is which
 * action the submit runs and where Cancel goes back to. Passing `person`
 * switches it to edit mode.
 */
export function PersonForm({
  organizations,
  users,
  currentUserId,
  person,
}: {
  organizations: OrganizationRow[];
  users: UserOption[];
  currentUserId: string;
  /** Omitted when creating. */
  person?: PersonRow;
}) {
  const initial: PersonFormState = {
    error: null,
    values: person
      ? {
          name: person.name,
          orgId: person.organizationId ?? "",
          email: person.email ?? "",
          phone: person.phone ?? "",
          ownerId: person.ownerId ?? "",
        }
      : // A new contact defaults to whoever is adding it; an existing one
        // keeps whatever it already has, including nobody.
        { name: "", orgId: "", email: "", phone: "", ownerId: currentUserId },
  };

  // .bind pins the row being edited server-side. A hidden id input would
  // work too, and would be an editable claim about which row to overwrite.
  const action = person ? updatePerson.bind(null, person.id) : createPerson;
  const [state, formAction, pending] = useActionState(action, initial);
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
        cancelHref={person ? `/contacts/people/${person.id}` : "/contacts/people"}
        submitLabel={person ? "Save changes" : "Add contact"}
      />
    </form>
  );
}
