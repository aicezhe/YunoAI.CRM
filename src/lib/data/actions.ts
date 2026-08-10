"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin, requireUser } from "@/lib/auth/current-user";
import { isAppRole } from "@/lib/auth/roles";

/**
 * Tick an activity off from wherever it is listed.
 *
 * The dashboard's whole premise is that today's work can be cleared without
 * leaving the screen, so this is a Server Action rather than a link to an
 * edit form. revalidatePath("/", "layout") rather than a single route: the
 * same activity drives the dashboard count, the activities table and the
 * deal's own feed, and ticking it on one must not leave the others stale.
 */
export async function setActivityDone(id: string, done: boolean): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("activities").update({ done }).eq("id", id);

  if (error) {
    console.error("[activities] toggle failed:", error.message);
    // Thrown, not returned: the caller is an optimistic checkbox, and the
    // rejection is what tells React to roll the tick back.
    throw new Error("Could not update this activity.");
  }

  revalidatePath("/", "layout");
}

/**
 * Empties the archive: deletes every completed activity, for everyone.
 *
 * A hard delete, not a flag. An "archived" flag on top of `done` would mean
 * three states for one boolean question and a third list to keep straight,
 * and the point of clearing an archive is that the rows stop existing.
 *
 * Deliberately not scoped to the caller: activities are team-wide here (see
 * the RLS policies in the migration), so clearing removes the team's finished
 * history, not just your own. The button that calls this says so and asks
 * twice — that confirmation is the only thing between a click and permanent
 * loss, since there is no undo.
 *
 * Returns the number deleted so the caller can report it.
 */
export async function clearActivityArchive(): Promise<number> {
  const supabase = await createClient();

  // .select() makes the delete return the rows it removed, which is the only
  // way to get a count back — Postgres gives no row count through PostgREST
  // otherwise.
  const { data, error } = await supabase
    .from("activities")
    .delete()
    .eq("done", true)
    .select("id");

  if (error) {
    console.error("[activities] clearing archive failed:", error.message);
    throw new Error("Could not clear the archive.");
  }

  revalidatePath("/", "layout");
  return data.length;
}

export type ContractFormValues = {
  dealId: string;
  signedDate: string;
  value: string;
  notes: string;
};

export type ContractFormState = { error: string | null; values: ContractFormValues };

/**
 * Records a signed contract against a deal — the app's first create form.
 *
 * Validation here mirrors the database's own constraints (0009_contracts.sql)
 * and nothing more: deal_id and signed_date are NOT NULL, value is CHECKed
 * >= 0 when present. There is no rule limiting this to won deals, on purpose
 * — the schema doesn't have one either, so inventing one client-side would
 * enforce a business rule nobody actually decided on.
 */
export async function createContract(
  _prevState: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const dealId = String(formData.get("dealId") ?? "");
  const signedDate = String(formData.get("signedDate") ?? "");
  const rawValue = String(formData.get("value") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  // Echoed back into every error return below. useActionState re-renders the
  // form from this state on each round trip; without feeding the submitted
  // values back as defaultValue, a typo in one field wiped every other field
  // the person had already filled in — found by actually submitting this
  // form end to end, not by inspection.
  const values: ContractFormValues = { dealId, signedDate, value: rawValue, notes };

  if (!dealId) return { error: "Choose a deal.", values };
  if (!signedDate) return { error: "Enter the date it was signed.", values };

  let value: number | null = null;
  if (rawValue) {
    value = Number(rawValue);
    // Native number inputs already keep out non-numeric text; this guards
    // the boundary itself (a direct POST, not the browser's own input) and
    // matches the same >= 0 the database would otherwise reject it for.
    if (!Number.isFinite(value) || value < 0) {
      return { error: "Value must be a positive number.", values };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contracts").insert({
    deal_id: dealId,
    signed_date: signedDate,
    value,
    notes: notes || null,
  });

  if (error) {
    console.error("[contracts] create failed:", error.message);
    return { error: "Could not save this contract. Try again.", values };
  }

  revalidatePath("/", "layout");
  // Outside the error check on purpose: redirect() signals by throwing, and
  // catching it here would report a phantom save failure.
  redirect("/contracts");
}

export type OrganizationFormValues = {
  name: string;
  industry: string;
  address: string;
  website: string;
  ownerId: string;
};

export type OrganizationFormState = { error: string | null; values: OrganizationFormValues };

/** name is the only NOT NULL column (0004_organizations.sql) — everything
 *  else, including the owner, is genuinely optional at creation. */
export async function createOrganization(
  _prevState: OrganizationFormState,
  formData: FormData,
): Promise<OrganizationFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const ownerId = String(formData.get("ownerId") ?? "");

  const values: OrganizationFormValues = { name, industry, address, website, ownerId };

  if (!name) return { error: "Enter a name.", values };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name,
      industry: industry || null,
      address: address || null,
      website: website || null,
      owner_id: ownerId || null,
    })
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

export type PersonFormValues = {
  name: string;
  orgId: string;
  email: string;
  phone: string;
  ownerId: string;
};

export type PersonFormState = { error: string | null; values: PersonFormValues };

/** name is the only NOT NULL column (0005_persons.sql). org_id is nullable
 *  by design — an individual with no company yet is a normal contact, not a
 *  data-entry error (see the schema comment, and Federica Lombardi in the
 *  demo data). */
export async function createPerson(
  _prevState: PersonFormState,
  formData: FormData,
): Promise<PersonFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const orgId = String(formData.get("orgId") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const ownerId = String(formData.get("ownerId") ?? "");

  const values: PersonFormValues = { name, orgId, email, phone, ownerId };

  if (!name) return { error: "Enter a name.", values };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("persons")
    .insert({
      name,
      org_id: orgId || null,
      email: email || null,
      phone: phone || null,
      owner_id: ownerId || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[persons] create failed:", error.message);
    return { error: "Could not save this contact. Try again.", values };
  }

  revalidatePath("/", "layout");
  redirect(`/contacts/people/${data.id}`);
}

export type DealFormValues = {
  title: string;
  orgId: string;
  personId: string;
  stageId: string;
  value: string;
  expectedCloseDate: string;
  ownerId: string;
};

export type DealFormState = { error: string | null; values: DealFormValues };

/**
 * Validation mirrors 0006_deals.sql: title is NOT NULL, value is CHECKed >=
 * 0, and deals_has_counterparty requires an organization or a person — not
 * necessarily both, and the form enforces exactly that, nothing stricter.
 *
 * status is never a form field: it defaults to 'open' at the database level,
 * and every deal made here starts open by construction. Marking one won or
 * lost is an edit to an existing deal, not something creation needs to
 * express — lost_reason's two-way CHECK only becomes relevant there.
 *
 * stage_id is nullable in the schema, but leaving a deal off the board
 * entirely is not a real workflow this app has, so the form defaults it to
 * the first stage by position rather than leaving it unset — while still
 * allowing "No stage" explicitly, so the schema's own flexibility isn't
 * silently narrowed into a hard requirement.
 */
export async function createDeal(
  _prevState: DealFormState,
  formData: FormData,
): Promise<DealFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const orgId = String(formData.get("orgId") ?? "");
  const personId = String(formData.get("personId") ?? "");
  const stageId = String(formData.get("stageId") ?? "");
  const rawValue = String(formData.get("value") ?? "").trim();
  const expectedCloseDate = String(formData.get("expectedCloseDate") ?? "");
  const ownerId = String(formData.get("ownerId") ?? "");

  const values: DealFormValues = {
    title,
    orgId,
    personId,
    stageId,
    value: rawValue,
    expectedCloseDate,
    ownerId,
  };

  if (!title) return { error: "Enter a title.", values };
  if (!orgId && !personId) return { error: "Choose an organization or a contact.", values };

  let value: number | null = null;
  if (rawValue) {
    value = Number(rawValue);
    if (!Number.isFinite(value) || value < 0) {
      return { error: "Value must be a positive number.", values };
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .insert({
      title,
      org_id: orgId || null,
      person_id: personId || null,
      stage_id: stageId || null,
      value,
      expected_close_date: expectedCloseDate || null,
      owner_id: ownerId || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[deals] create failed:", error.message);
    return { error: "Could not save this deal. Try again.", values };
  }

  revalidatePath("/", "layout");
  redirect(`/deals/${data.id}`);
}

export type ActivityFormValues = {
  type: string;
  subject: string;
  dealId: string;
  personId: string;
  orgId: string;
  dueAt: string;
};

export type ActivityFormState = { error: string | null; values: ActivityFormValues };

/**
 * Validation mirrors 0008_activities.sql: type and subject are NOT NULL, and
 * activities_has_link requires at least one of deal/person/org — any one is
 * enough, matching the schema comment's own reasoning (a call from a
 * company's main line has no person to attach; a note on a deal has neither).
 *
 * created_by is not a form field — it is always the signed-in user. Letting
 * someone log an activity "as" a colleague via a picker would misattribute
 * it; requireUser() is the same authorization boundary every protected page
 * already relies on. done is not a field either: every activity starts
 * open (false) — ticking one off is a separate action once it exists.
 *
 * dueAt is the one field that changes shape: `datetime-local` inputs submit
 * "2026-08-09T14:30" with no timezone, which Postgres would otherwise read
 * as UTC. `new Date(...)` interprets that string in the server's own local
 * time instead, which is what the picker showed the person filling it in.
 */
export async function createActivity(
  _prevState: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  const type = String(formData.get("type") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const dealId = String(formData.get("dealId") ?? "");
  const personId = String(formData.get("personId") ?? "");
  const orgId = String(formData.get("orgId") ?? "");
  const dueAt = String(formData.get("dueAt") ?? "");

  const values: ActivityFormValues = { type, subject, dealId, personId, orgId, dueAt };

  if (!type) return { error: "Choose a type.", values };
  if (!subject) return { error: "Enter a subject.", values };
  if (!dealId && !personId && !orgId) {
    return { error: "Link this to a deal, a contact or an organization.", values };
  }

  const user = await requireUser();

  const supabase = await createClient();
  const { error } = await supabase.from("activities").insert({
    type,
    subject,
    deal_id: dealId || null,
    person_id: personId || null,
    org_id: orgId || null,
    due_at: dueAt ? new Date(dueAt).toISOString() : null,
    created_by: user.id,
  });

  if (error) {
    console.error("[activities] create failed:", error.message);
    return { error: "Could not save this activity. Try again.", values };
  }

  revalidatePath("/", "layout");
  redirect("/activities/open");
}

export type ProfileNameState = { error: string | null; name: string };

/**
 * Renames the signed-in user — nobody else's row, and nothing but the name.
 *
 * That restriction is enforced twice, deliberately. requireUser() plus the
 * .eq("id", user.id) below stop this action from ever being called against
 * another id, and the migration 0012 policy stops the request even if it
 * somehow reached the database with a different id or an extra field —
 * belt and braces around the one write a member is allowed to make to their
 * own row.
 */
export async function updateProfileName(
  _prevState: ProfileNameState,
  formData: FormData,
): Promise<ProfileNameState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Enter a name.", name };

  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("users").update({ name }).eq("id", user.id);

  if (error) {
    console.error("[users] rename failed:", error.message);
    return { error: "Could not save your name. Try again.", name };
  }

  // Every screen that shows a name — the sidebar, every Owner column, every
  // record this person owns — reads it from this one row.
  revalidatePath("/", "layout");
  return { error: null, name };
}

export type PasswordState = { error: string | null; done: boolean };

/**
 * Sets a new password for the signed-in user.
 *
 * No "current password" re-check: getting here already required a valid
 * session (the (app) layout's requireUser()), and Supabase Auth's own
 * updateUser() call is what actually performs the change — there is no
 * separate public.users write for RLS to gate, so migration 0012 is
 * unrelated to this path.
 */
export async function updatePassword(
  _prevState: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) return { error: "Use at least 8 characters.", done: false };
  if (password !== confirm) return { error: "Passwords don't match.", done: false };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("[auth] password update failed:", error.message);
    return { error: "Could not update your password. Try again.", done: false };
  }

  return { error: null, done: true };
}

/**
 * Admin-only: changes a teammate's role.
 *
 * isAdmin() is checked here even though migration 0010's users_write_admin
 * policy would reject the write anyway — the same "boundary" reasoning as
 * everywhere else in this file: the database is the real enforcement, but
 * failing before the query names the actual problem ("not an admin")
 * instead of a generic Postgres permission error.
 *
 * A caller cannot change their own role, admin or not. Nothing in the
 * schema stops a lone admin demoting themselves to member and locking the
 * team out of the one screen that grants admin back — since promoting
 * requires being an admin already, that lockout has no recovery path short
 * of the Supabase Dashboard. Refusing it here is cheaper than a "you are
 * the last admin" check that has to stay correct as the team grows.
 */
export async function setUserRole(userId: string, role: string): Promise<void> {
  if (!(await isAdmin())) throw new Error("Only admins can change roles.");
  if (!isAppRole(role)) throw new Error("Not a real role.");

  const user = await requireUser();
  if (userId === user.id) throw new Error("You can't change your own role.");

  const supabase = await createClient();
  const { error } = await supabase.from("users").update({ role }).eq("id", userId);

  if (error) {
    console.error("[users] role change failed:", error.message);
    throw new Error("Could not change this person's role.");
  }

  revalidatePath("/", "layout");
}
