"use client";

import { useActionState } from "react";
import { updateProfileName, type ProfileNameState } from "@/lib/data/actions";
import { FIELD_CLASS } from "@/components/ui/form";

/**
 * The one field a member can edit about their own row — see migration 0012.
 * Email and role are shown elsewhere on this page as plain text, not inputs;
 * there is nothing here that would accept a change to them.
 */
export function ProfileNameForm({ name }: { name: string }) {
  const [state, formAction, pending] = useActionState(updateProfileName, {
    error: null,
    name,
  } satisfies ProfileNameState);

  return (
    <form action={formAction} className="flex flex-wrap items-start gap-3">
      <div className="min-w-[12rem] flex-1">
        <input
          name="name"
          defaultValue={state.name}
          required
          className={`${FIELD_CLASS} max-w-xs`}
        />
        {state.error && <p className="mt-1.5 text-sm text-red-500">{state.error}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 shrink-0 items-center rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
