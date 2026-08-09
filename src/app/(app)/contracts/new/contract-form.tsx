"use client";

import { useActionState } from "react";
import { createContract, type ContractFormState } from "@/lib/data/actions";
import { Field, FIELD_CLASS, FormActions, FORM_CARD_CLASS, SelectField } from "@/components/ui/form";
import type { DealRow } from "@/lib/data/types";

export function ContractForm({ deals, today }: { deals: DealRow[]; today: string }) {
  const initial: ContractFormState = {
    error: null,
    values: { dealId: "", signedDate: today, value: "", notes: "" },
  };
  const [state, formAction, pending] = useActionState(createContract, initial);
  const { values } = state;

  return (
    <form action={formAction} noValidate className={FORM_CARD_CLASS}>
      <SelectField
        id="dealId"
        name="dealId"
        label="Deal"
        required
        defaultValue={values.dealId}
        placeholder="Choose a deal…"
        options={deals.map((deal) => ({
          value: deal.id,
          label: `${deal.title} — ${deal.organizationName ?? deal.personName ?? "no counterparty"}`,
        }))}
      />

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
