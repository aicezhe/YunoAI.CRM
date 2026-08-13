"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/current-user";

/**
 * Server Action for recording a signed contract against a deal.
 */

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

/**
 * Corrects a recorded contract — admin-only, and the app's first permission
 * drawn between the roles outside of Settings.
 *
 * Why the asymmetry: creating a contract is part of closing a deal and stays
 * open to everyone, but a signed contract's value is the number revenue
 * would be reconciled against. Correcting bookkeeping is an accountable act,
 * which is what the admin role is — a member who spots a wrong amount asks,
 * an admin fixes and answers for it. Enforced three deep, like roles: the
 * Edit button only renders for admins, this action refuses non-admins, and
 * the contracts UPDATE policy requires is_admin() (0018), so even a direct
 * PostgREST call cannot slip past.
 *
 * The deal link is deliberately not editable. Re-attaching a contract to a
 * different deal is not a correction, it is a different contract — and every
 * screen that shows this row reaches it through the deal it hangs off.
 */
export async function updateContract(
  id: string,
  _prevState: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const signedDate = String(formData.get("signedDate") ?? "");
  const rawValue = String(formData.get("value") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const values: ContractFormValues = { dealId: "", signedDate, value: rawValue, notes };

  if (!(await isAdmin())) {
    return { error: "Only an admin can edit a recorded contract.", values };
  }

  if (!signedDate) return { error: "Enter the date it was signed.", values };

  let value: number | null = null;
  if (rawValue) {
    value = Number(rawValue);
    if (!Number.isFinite(value) || value < 0) {
      return { error: "Value must be a positive number.", values };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("contracts")
    .update({ signed_date: signedDate, value, notes: notes || null })
    .eq("id", id);

  if (error) {
    console.error("[contracts] update failed:", error.message);
    return { error: "Could not save your changes. Try again.", values };
  }

  revalidatePath("/", "layout");
  redirect(`/contracts/${id}`);
}
