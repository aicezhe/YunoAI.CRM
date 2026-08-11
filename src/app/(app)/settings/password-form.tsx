"use client";

import { useActionState, useEffect, useRef } from "react";
import { type PasswordState, updatePassword } from "@/lib/data/actions/account";
import { Field, FIELD_CLASS } from "@/components/ui/form";

const INITIAL: PasswordState = { error: null, done: false };

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  // A native reset, not a key-remount: remounting would recreate the
  // useActionState hook too, and its state.done — the very thing this
  // effect is reacting to — would go back to false before the confirmation
  // ever painted. The DOM reset clears the two password fields without
  // touching React or hook state at all.
  useEffect(() => {
    if (state.done) formRef.current?.reset();
  }, [state.done]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="password" label="New password">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className={FIELD_CLASS}
          />
        </Field>
        <Field id="confirm" label="Confirm password">
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            className={FIELD_CLASS}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Update password"}
        </button>
        {state.done && <span className="text-sm text-emerald-600">Password updated.</span>}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      )}
    </form>
  );
}
