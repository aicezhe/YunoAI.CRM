"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createContract, type ContractFormState } from "@/lib/data/actions";
import type { DealRow } from "@/lib/data/types";

/** Same field treatment as the login form — the only other form in the app
 *  so far — for one consistent visual language across both. */
const FIELD_CLASS =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";

export function ContractForm({ deals, today }: { deals: DealRow[]; today: string }) {
  const initial: ContractFormState = {
    error: null,
    values: { dealId: "", signedDate: today, value: "", notes: "" },
  };
  const [state, formAction, pending] = useActionState(createContract, initial);
  const { values } = state;

  // The deal picker is the one field that has to be controlled rather than
  // defaultValue-based. React re-walks a <select>'s options on every render
  // of its own accord (unlike a plain input, where an uncontrolled value is
  // truly left alone after mount), and re-asserts the ORIGINAL defaultValue
  // — so after a failed submission re-renders this form, the picked deal
  // silently reverted to "Choose a deal…" even though the field's own
  // `defaultValue={values.dealId}` was correct. Confirmed by hand: date,
  // value and notes survive a failed round trip untouched; only the select
  // did not, and only switching it to onChange-driven local state fixed it.
  const [dealId, setDealId] = useState(values.dealId);

  return (
    <form
      action={formAction}
      noValidate
      className="space-y-5 rounded-3xl border border-brand-200/70 bg-white p-6 shadow-sm"
    >
      <div>
        <label htmlFor="dealId" className="mb-1.5 block text-sm font-medium text-gray-700">
          Deal
        </label>
        <select
          id="dealId"
          name="dealId"
          required
          value={dealId}
          onChange={(e) => setDealId(e.target.value)}
          className={FIELD_CLASS}
        >
          <option value="" disabled>
            Choose a deal…
          </option>
          {deals.map((deal) => (
            <option key={deal.id} value={deal.id}>
              {deal.title} — {deal.organizationName ?? deal.personName ?? "no counterparty"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="signedDate" className="mb-1.5 block text-sm font-medium text-gray-700">
          Signed date
        </label>
        <input
          id="signedDate"
          name="signedDate"
          type="date"
          required
          defaultValue={values.signedDate}
          className={FIELD_CLASS}
        />
      </div>

      <div>
        <label htmlFor="value" className="mb-1.5 block text-sm font-medium text-gray-700">
          Value <span className="font-normal text-gray-400">(optional)</span>
        </label>
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
      </div>

      <div>
        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-gray-700">
          Notes <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Terms worth remembering — renewal, payment schedule, anything unusual."
          defaultValue={values.notes}
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
        {/* Reserves its line whether or not there's a message, so the form
            doesn't jump when an error appears — same treatment as login. */}
        <p
          role="alert"
          aria-live="polite"
          className={`min-h-5 flex-1 text-sm text-red-500 ${state.error ? "" : "invisible"}`}
        >
          {state.error ?? " "}
        </p>

        <Link
          href="/contracts"
          className="inline-flex min-h-11 items-center rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-brand-500 px-5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending && (
            <span
              aria-hidden
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
          )}
          {pending ? "Saving…" : "Add contract"}
        </button>
      </div>
    </form>
  );
}
