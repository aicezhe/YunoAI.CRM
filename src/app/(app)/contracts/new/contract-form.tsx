"use client";

import { useActionState } from "react";
import { type ContractFormState, createContract } from "@/lib/data/actions/contracts";
import { Field, FIELD_CLASS, FormActions, FORM_CARD_CLASS, SelectField } from "@/components/ui/form";
import type { DealRow } from "@/lib/data/types";

export function ContractForm({
  deals,
  today,
  deal,
}: {
  deals: DealRow[];
  today: string;
  /** Set when this was opened from a deal's own record. The deal is then
   *  stated rather than chosen — it is the whole reason the form is open,
   *  and re-picking it from a list of every deal in the pipeline is a step
   *  backwards. */
  deal?: DealRow;
}) {
  const initial: ContractFormState = {
    error: null,
    values: { dealId: deal?.id ?? "", signedDate: today, value: "", notes: "" },
  };
  const [state, formAction, pending] = useActionState(createContract, initial);
  const { values } = state;

  return (
    <form action={formAction} noValidate className={FORM_CARD_CLASS}>
      {deal ? (
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
        cancelHref="/contracts"
        submitLabel="Add contract"
      />
    </form>
  );
}
