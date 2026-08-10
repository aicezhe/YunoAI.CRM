"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signIn, type SignInState } from "@/lib/auth/actions";

const INITIAL: SignInState = { error: null };

const FIELD_CLASS =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 placeholder-gray-400 outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 sm:text-sm";

/**
 * The sign-in form. Submits to the `signIn` Server Action through
 * useActionState, so it keeps working before hydration — a plain form POST
 * either way, with the pending flag only affecting the button's label.
 */
export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signIn, INITIAL);
  const [showPassword, setShowPassword] = useState(false);

  return (
    // Inputs are 16px on phones and 14px from sm up: below 16px, iOS Safari
    // zooms the whole page in when a field takes focus.
    <form action={formAction} noValidate className="space-y-5">
      <input type="hidden" name="next" value={next} />

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="you@company.com"
          className={FIELD_CLASS}
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className={`${FIELD_CLASS} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-3.5 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
          >
            {showPassword ? (
              <EyeOff className="h-4.5 w-4.5" strokeWidth={1.75} />
            ) : (
              <Eye className="h-4.5 w-4.5" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && (
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
        )}
        {pending ? "Signing in…" : "Sign in"}
      </button>

      {/* Reserves its line whether or not there's a message, so the card
          doesn't jump when an error appears. */}
      <p
        role="alert"
        aria-live="polite"
        className={`min-h-5 text-center text-sm text-red-500 ${state.error ? "" : "invisible"}`}
      >
        {state.error ?? " "}
      </p>
    </form>
  );
}
