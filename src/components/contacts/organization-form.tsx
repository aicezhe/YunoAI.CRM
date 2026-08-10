"use client";

import { useActionState } from "react";
import {
  createOrganization,
  updateOrganization,
  type OrganizationFormState,
} from "@/lib/data/actions";
import { Field, FIELD_CLASS, FormActions, FORM_CARD_CLASS, SelectField } from "@/components/ui/form";
import type { OrganizationRow } from "@/lib/data/types";
import type { UserOption } from "@/lib/data/users";

/** Shared by "Add organization" and "Edit organization" — see PersonForm for
 *  the reasoning; passing `organization` switches it to edit mode. */
export function OrganizationForm({
  users,
  currentUserId,
  organization,
}: {
  users: UserOption[];
  currentUserId: string;
  /** Omitted when creating. */
  organization?: OrganizationRow;
}) {
  const initial: OrganizationFormState = {
    error: null,
    values: organization
      ? {
          name: organization.name,
          industry: organization.industry ?? "",
          address: organization.address ?? "",
          website: organization.website ?? "",
          ownerId: organization.ownerId ?? "",
        }
      : { name: "", industry: "", address: "", website: "", ownerId: currentUserId },
  };

  const action = organization
    ? updateOrganization.bind(null, organization.id)
    : createOrganization;
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
        cancelHref={
          organization ? `/contacts/organizations/${organization.id}` : "/contacts/organizations"
        }
        submitLabel={organization ? "Save changes" : "Add organization"}
      />
    </form>
  );
}
