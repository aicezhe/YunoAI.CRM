"use client";

import { useActionState } from "react";
import {
  type ContractFormState,
  createContract,
  updateContract,
} from "@/lib/data/actions/contracts";
import { Field, FIELD_CLASS, FormActions, FORM_CARD_CLASS, SelectField } from "@/components/ui/form";
import type { ContractRow, DealRow } from "@/lib/data/types";

/**
 * Shared by "Add contract" and "Edit contract", the same shape PersonForm
 * and DealForm use: passing `contract` switches to edit mode, which changes
 * the action, the Cancel target and the submit label. In edit mode the deal
 * is never a choice — see updateContract for why.
 */
export function ContractForm({
  deals,
  today,
  deal,
  contract,
}: {
  deals: DealRow[];
  today: string;
  /** Set when this was opened from a deal's own record. The deal is then
   *  stated rather than chosen — it is the whole reason the form is open,
   *  and re-picking it from a list of every deal in the pipeline is a step
   *  backwards. */
  deal?: DealRow;
  /** Omitted when creating. Edit is admin-only — the page enforces it, the
   *  action re-checks it, and RLS backs both (0018). */
  contract?: ContractRow;
}) {
  const initial: ContractFormState = {
    error: null,
    values: contract
      ? {
          dealId: contract.dealId,
          signedDate: contract.signedDate,
          value: contract.value === null ? "" : String(contract.value),
          notes: contract.notes ?? "",
        }
      : { dealId: deal?.id ?? "", signedDate: today, value: "", notes: "" },
  };
  const action = contract ? updateContract.bind(null, contract.id) : createContract;
  const [state, formAction, pending] = useActionState(action, initial);
  const { values } = state;

  return (
    <form action={formAction} noValidate className={FORM_CARD_CLASS}>
      {contract ? (
        <div>
          <span className="mb-1.5 block text-sm font-medium text-gray-700">Deal</span>
          <p className="px-1 py-2.5 text-sm text-gray-900">{contract.dealTitle ?? "Deal"}</p>
        </div>
      ) : deal ? (
        <div>
          <span className="mb-1.5 block text-sm font-medium text-gray-700">Deal</span>
          {/* Inert, and the id travels in a hidden input rather than a
              disabled select — a disabled control submits nothing, and
              createContract needs the deal. */}
          <p className="px-1 py-2.5 text-sm text-gray-900">
            {deal.title}
            <span className="ml-2 text-gray-400">
              {deal.organizationName ?? deal.personName ?? "no counterparty"}
            </span>
          </p>
          <input type="hidden" name="dealId" value={deal.id} />
        </div>
      ) : (
        <SelectField
          id="dealId"
          name="dealId"
          label="Deal"
          required
          defaultValue={values.dealId}
          placeholder="Choose a deal…"
          options={deals.map((d) => ({
            value: d.id,
            label: `${d.title} — ${d.organizationName ?? d.personName ?? "no counterparty"}`,
          }))}
        />
      )}

      <Field id="signedDate" label="Signed date">
        <input
          id="signedDate"
          name="signedDate"
          type="date"
          required
          defaultValue={values.signedDate}
          className={FIELD_CLASS}
        />
      </Field>

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

      <Field id="notes" label="Notes" optional>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Terms worth remembering — renewal, payment schedule, anything unusual."
          defaultValue={values.notes}
          className={FIELD_CLASS}
        />
      </Field>

      <FormActions
        error={state.error}
        pending={pending}
        cancelHref={contract ? `/contracts/${contract.id}` : deal ? `/deals/${deal.id}` : "/contracts"}
        submitLabel={contract ? "Save changes" : "Add contract"}
      />
    </form>
  );
}
