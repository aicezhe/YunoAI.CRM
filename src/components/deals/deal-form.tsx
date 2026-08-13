"use client";

import { useState } from "react";
import { useActionState } from "react";
import { type DealFormState, createDeal, updateDeal } from "@/lib/data/actions/deals";
import {
  Field,
  FIELD_CLASS,
  FormActions,
  FORM_CARD_CLASS,
  OwnerField,
  SelectField,
} from "@/components/ui/form";
import type { DealRow, OrganizationRow, PersonRow } from "@/lib/data/types";
import type { StageOption } from "@/lib/data/deals";
import type { UserOption } from "@/lib/data/users";

/** deals.currency is `text check (currency ~ '^[A-Z]{3}$')` — a fixed list
 *  rather than a free field, so a typo cannot be rejected by the database
 *  after the rest of the form was filled in. */
const CURRENCIES = ["EUR", "USD", "GBP", "CHF"].map((c) => ({ value: c, label: c }));

/**
 * Shared by "Add deal" and "Edit deal" — same fields, same validation, the
 * way PersonForm and OrganizationForm already work. Passing `deal` switches
 * it to edit mode, which changes exactly three things: the action it submits
 * to, where Cancel goes, and whether Owner is a picker.
 */
export function DealForm({
  organizations,
  persons,
  stages,
  users,
  currentUserId,
  prefill,
  deal,
}: {
  organizations: OrganizationRow[];
  persons: PersonRow[];
  stages: StageOption[];
  users: UserOption[];
  currentUserId: string;
  /** Counterparty carried in from wherever this was opened — the "Add deal"
   *  button on a contact's or a company's record. Creation only. */
  prefill?: { orgId?: string; personId?: string };
  /** Omitted when creating. */
  deal?: DealRow;
}) {
  const initial: DealFormState = {
    error: null,
    values: deal
      ? {
          title: deal.title,
          orgId: deal.organizationId ?? "",
          personId: deal.personId ?? "",
          stageId: deal.stageId ?? "",
          value: deal.value === null ? "" : String(deal.value),
          currency: deal.currency ?? "EUR",
          expectedCloseDate: deal.expectedCloseDate ?? "",
          ownerId: deal.ownerId ?? "",
          lostReason: deal.lostReason ?? "",
        }
      : {
          title: "",
          orgId: prefill?.orgId ?? "",
          personId: prefill?.personId ?? "",
          // The board's first column — see the comment on createDeal for why
          // a real default beats leaving this at "no stage".
          stageId: stages[0]?.id ?? "",
          value: "",
          currency: "EUR",
          expectedCloseDate: "",
          ownerId: currentUserId,
          lostReason: "",
        },
  };

  // .bind pins the row being edited server-side. A hidden id input would
  // work too, and would be an editable claim about which row to overwrite.
  const action = deal ? updateDeal.bind(null, deal.id) : createDeal;
  const [state, formAction, pending] = useActionState(action, initial);
  const { values } = state;

  // Watched rather than read off `values`, because the reason field has to
  // appear the moment Lost is picked — not after a failed round trip.
  const [stageId, setStageId] = useState(values.stageId);
  const lostStageId = stages.find((s) => s.name === "Lost")?.id;
  const isLost = Boolean(lostStageId) && stageId === lostStageId;

  // The counterparty pair, watched so the two pickers can help each other as
  // they change. Deliberately only *help*: picking someone from another
  // company stays possible and saveable. A consultant representing a client,
  // somebody who changed jobs last week, a broker — all real, and a hard rule
  // would block them to prevent a mistake that a sentence of text prevents
  // just as well.
  const [orgId, setOrgId] = useState(values.orgId);
  const [personId, setPersonId] = useState(values.personId);

  const person = persons.find((p) => p.id === personId);
  const org = organizations.find((o) => o.id === orgId);

  // The chosen company's own people float to the top of the picker; everyone
  // else stays reachable below. Grouping, not filtering — see above.
  const sameOrg = orgId ? persons.filter((p) => p.organizationId === orgId) : [];
  const others = orgId ? persons.filter((p) => p.organizationId !== orgId) : persons;
  const toOption = (p: PersonRow) => ({ value: p.id, label: p.name });

  // Stated as a fact, not raised as an error: the person may well be the
  // right one.
  const mismatch =
    person && orgId && person.organizationId !== orgId && person.organizationName
      ? `${person.name} works at ${person.organizationName}.`
      : null;

  // The other direction — a contact picked while Organization is still
  // empty. Offered rather than applied: silently filling a field the person
  // did not touch is how forms end up saying things nobody typed.
  const suggestedOrg =
    person && !orgId && person.organizationId && person.organizationName
      ? { id: person.organizationId, name: person.organizationName }
      : null;

  return (
    <form action={formAction} noValidate className={FORM_CARD_CLASS}>
      <Field id="title" label="Title">
        <input
          id="title"
          name="title"
          required
          defaultValue={values.title}
          placeholder="New website for Acme"
          className={FIELD_CLASS}
        />
      </Field>

      {/* Two independent pickers, not one combined "counterparty" field — a
          deal can have an organization, a person, or both (see how the deals
          list shows the person under the org when there's both). The schema
          only demands at least one; the form doesn't ask for more than that. */}
      <SelectField
        key={`org-${orgId}`}
        id="orgId"
        name="orgId"
        label="Organization"
        optional
        defaultValue={orgId}
        placeholder="No organization"
        options={organizations.map((o) => ({ value: o.id, label: o.name }))}
        onValueChange={setOrgId}
      />

      <div>
        <SelectField
          id="personId"
          name="personId"
          label="Contact"
          optional
          defaultValue={values.personId}
          placeholder="No contact"
          groups={
            sameOrg.length > 0 && org
              ? [
                  { label: org.name, options: sameOrg.map(toOption) },
                  { label: "Other contacts", options: others.map(toOption) },
                ]
              : undefined
          }
          options={sameOrg.length > 0 && org ? [] : others.map(toOption)}
          onValueChange={setPersonId}
        />

        {mismatch && (
          <p className="mt-1.5 text-sm text-gray-500">
            <span className="font-medium text-gray-600">{mismatch}</span> Keep it if that is right.
          </p>
        )}

        {suggestedOrg && (
          <p className="mt-1.5 text-sm text-gray-500">
            {person?.name} works at {suggestedOrg.name}.{" "}
            <button
              type="button"
              onClick={() => setOrgId(suggestedOrg.id)}
              className="font-medium text-brand-600 transition-colors hover:text-brand-500 hover:underline"
            >
              Use it as the organization
            </button>
          </p>
        )}
      </div>

      <SelectField
        id="stageId"
        name="stageId"
        label="Stage"
        optional
        defaultValue={values.stageId}
        placeholder="No stage"
        options={stages.map((s) => ({ value: s.id, label: s.name }))}
        onValueChange={setStageId}
      />

      {/* Only when the deal is being put in Lost. Required there and
          forbidden anywhere else — deals_lost_reason_matches_status enforces
          both directions, so asking for it unconditionally would produce a
          row the database refuses. */}
      {isLost && (
        <Field id="lostReason" label="Reason for losing">
          <input
            id="lostReason"
            name="lostReason"
            required
            defaultValue={values.lostReason}
            placeholder="Chose a competitor on price"
            className={FIELD_CLASS}
          />
        </Field>
      )}

      <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
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

        <SelectField
          id="currency"
          name="currency"
          label="Currency"
          defaultValue={values.currency}
          options={CURRENCIES}
        />
      </div>

      <Field id="expectedCloseDate" label="Expected close" optional>
        <input
          id="expectedCloseDate"
          name="expectedCloseDate"
          type="date"
          defaultValue={values.expectedCloseDate}
          className={FIELD_CLASS}
        />
      </Field>

      {/* Editable only in edit mode: a new deal belongs to whoever entered
          it, and reassigning it is exactly what this form is for. */}
      <OwnerField users={users} defaultValue={values.ownerId} editable={Boolean(deal)} />

      <FormActions
        error={state.error}
        pending={pending}
        cancelHref={deal ? `/deals/${deal.id}` : "/deals"}
        submitLabel={deal ? "Save changes" : "Add deal"}
      />
    </form>
  );
}
