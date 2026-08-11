"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/current-user";
import { getOrganizationDeleteImpact, getPersonDeleteImpact } from "../contacts";

/**
 * Server Actions for organizations and people — create, update, delete.
 */

export type OrganizationFormValues = {
  name: string;
  industry: string;
  address: string;
  website: string;
  ownerId: string;
};

export type OrganizationFormState = { error: string | null; values: OrganizationFormValues };

/** The form's fields, read and trimmed once — shared by create and update,
 *  which differ only in whether the result is inserted or written over an
 *  existing row. Empty optional fields become NULL rather than '': the
 *  column is nullable and "" would render as a present-but-blank value
 *  everywhere the app checks `?? <Missing />`. */
function readOrganizationForm(formData: FormData) {
  const values: OrganizationFormValues = {
    name: String(formData.get("name") ?? "").trim(),
    industry: String(formData.get("industry") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    website: String(formData.get("website") ?? "").trim(),
    ownerId: String(formData.get("ownerId") ?? ""),
  };
  return {
    values,
    row: {
      name: values.name,
      industry: values.industry || null,
      address: values.address || null,
      website: values.website || null,
      owner_id: values.ownerId || null,
    },
  };
}

/**
 * name is the only NOT NULL column (0004_organizations.sql) — everything
 * else is genuinely optional at creation.
 *
 * The owner is the exception: it is taken from the session, not the form.
 * Whoever adds a company is the one who has it, and the create form shows
 * that without offering a choice — so anything posted under `ownerId` could
 * only have been put there by hand. Reassignment lives in the edit form,
 * where changing someone else's ownership is a deliberate act.
 */
export async function createOrganization(
  _prevState: OrganizationFormState,
  formData: FormData,
): Promise<OrganizationFormState> {
  const { values, row } = readOrganizationForm(formData);

  if (!values.name) return { error: "Enter a name.", values };

  const owner = await requireUser();
  values.ownerId = owner.id;
  row.owner_id = owner.id;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("[organizations] create failed:", error.message);
    return { error: "Could not save this organization. Try again.", values };
  }

  revalidatePath("/", "layout");
  // Straight to the new record, not back to the list — unlike contracts,
  // which have no page of their own to land on.
  redirect(`/contacts/organizations/${data.id}`);
}

/** `id` is bound at the call site (`updateOrganization.bind(null, id)`), not
 *  taken from the form — a hidden id field would be an editable claim about
 *  which row to overwrite. */
export async function updateOrganization(
  id: string,
  _prevState: OrganizationFormState,
  formData: FormData,
): Promise<OrganizationFormState> {
  const { values, row } = readOrganizationForm(formData);

  if (!values.name) return { error: "Enter a name.", values };

  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update(row).eq("id", id);

  if (error) {
    console.error("[organizations] update failed:", error.message);
    return { error: "Could not save your changes. Try again.", values };
  }

  revalidatePath("/", "layout");
  redirect(`/contacts/organizations/${id}`);
}

/**
 * Deletes an organization, or refuses with a reason.
 *
 * deals.org_id is ON DELETE RESTRICT, so a company with deals cannot be
 * deleted at all — checked here first so the refusal names the count and
 * points at the fix, rather than surfacing Postgres's foreign-key error.
 * The database is still the real enforcement: the insert-between-check-and-
 * delete race falls through to the 23503 branch below, which is the same
 * refusal reached the other way.
 *
 * Everything else that points here is ON DELETE SET NULL — people are
 * detached rather than deleted (see 0005_persons.sql: deleting a company
 * must not delete the people you know there), and activities keep their
 * history minus the link.
 */
export async function deleteOrganization(id: string): Promise<{ error: string | null }> {
  await requireUser();

  const impact = await getOrganizationDeleteImpact(id);
  if (impact.deals > 0) {
    return {
      error: `This organization is on ${impact.deals} ${impact.deals === 1 ? "deal" : "deals"}. Reassign or delete ${impact.deals === 1 ? "it" : "them"} first.`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("organizations").delete().eq("id", id);

  if (error) {
    console.error("[organizations] delete failed:", error.message);
    if (error.code === "23503") {
      return { error: "This organization is still linked to a deal. Reassign it first." };
    }
    return { error: "Could not delete this organization. Try again." };
  }

  revalidatePath("/", "layout");
  redirect("/contacts/organizations");
}

export type PersonFormValues = {
  name: string;
  orgId: string;
  email: string;
  phone: string;
  ownerId: string;
};

export type PersonFormState = { error: string | null; values: PersonFormValues };

/** See readOrganizationForm — same split, same reason. */
function readPersonForm(formData: FormData) {
  const values: PersonFormValues = {
    name: String(formData.get("name") ?? "").trim(),
    orgId: String(formData.get("orgId") ?? ""),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    ownerId: String(formData.get("ownerId") ?? ""),
  };
  return {
    values,
    row: {
      name: values.name,
      org_id: values.orgId || null,
      email: values.email || null,
      phone: values.phone || null,
      owner_id: values.ownerId || null,
    },
  };
}

/** name is the only NOT NULL column (0005_persons.sql). org_id is nullable
 *  by design — an individual with no company yet is a normal contact, not a
 *  data-entry error (see the schema comment, and Federica Lombardi in the
 *  demo data). */
export async function createPerson(
  _prevState: PersonFormState,
  formData: FormData,
): Promise<PersonFormState> {
  const { values, row } = readPersonForm(formData);

  if (!values.name) return { error: "Enter a name.", values };

  // Owner from the session — see createOrganization for why.
  const owner = await requireUser();
  values.ownerId = owner.id;
  row.owner_id = owner.id;

  const supabase = await createClient();
  const { data, error } = await supabase.from("persons").insert(row).select("id").single();

  if (error) {
    console.error("[persons] create failed:", error.message);
    return { error: "Could not save this contact. Try again.", values };
  }

  revalidatePath("/", "layout");
  redirect(`/contacts/people/${data.id}`);
}

/** `id` is bound at the call site, not read from the form — see
 *  updateOrganization. */
export async function updatePerson(
  id: string,
  _prevState: PersonFormState,
  formData: FormData,
): Promise<PersonFormState> {
  const { values, row } = readPersonForm(formData);

  if (!values.name) return { error: "Enter a name.", values };

  const supabase = await createClient();
  const { error } = await supabase.from("persons").update(row).eq("id", id);

  if (error) {
    console.error("[persons] update failed:", error.message);
    return { error: "Could not save your changes. Try again.", values };
  }

  revalidatePath("/", "layout");
  redirect(`/contacts/people/${id}`);
}

/** Same shape as deleteOrganization: deals.person_id is ON DELETE RESTRICT
 *  and blocks the delete, activities.person_id is SET NULL and merely loses
 *  the link. */
export async function deletePerson(id: string): Promise<{ error: string | null }> {
  await requireUser();

  const impact = await getPersonDeleteImpact(id);
  if (impact.deals > 0) {
    return {
      error: `This contact is on ${impact.deals} ${impact.deals === 1 ? "deal" : "deals"}. Reassign or delete ${impact.deals === 1 ? "it" : "them"} first.`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("persons").delete().eq("id", id);

  if (error) {
    console.error("[persons] delete failed:", error.message);
    if (error.code === "23503") {
      return { error: "This contact is still linked to a deal. Reassign it first." };
    }
    return { error: "Could not delete this contact. Try again." };
  }

  revalidatePath("/", "layout");
  redirect("/contacts/people");
}
