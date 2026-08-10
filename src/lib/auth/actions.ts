"use server";

import { redirect } from "next/navigation";
import { isAuthRetryableFetchError, type AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { error: string | null };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Shown for every "the request never got there" case: DNS, refused,
 *  offline, or our own timeout. The distinction isn't actionable. */
const UNREACHABLE = "Could not reach the server. Check your connection and try again.";

/** Supabase's own wire string for a bad email/password pair. Compared
 *  against, never shown — the message the user sees is ours. */
const SUPABASE_BAD_CREDENTIALS = "Invalid login credentials";

/** Without this, an unreachable Supabase leaves the submit button spinning
 *  with no way out — the request never rejects on its own. 12s is generous
 *  for a real sign-in and short enough that an outage reads as broken. */
const SIGN_IN_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("TIMEOUT")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * Email + password sign-in.
 *
 * Runs on the server so the Supabase keys stay out of the client bundle —
 * see lib/supabase/server.ts. On success Supabase's cookie pair is written
 * through the Server Action's cookie jar and the browser is redirected;
 * on failure the form re-renders with a message and the typed email intact.
 */
export async function signIn(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (!password) return { error: "Enter your password." };

  const supabase = await createClient();

  let authError: AuthError | null;
  try {
    ({ error: authError } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      SIGN_IN_TIMEOUT_MS,
    ));
  } catch {
    // Only the timeout lands here — a network failure does not reject, see
    // below.
    return { error: UNREACHABLE };
  }

  if (authError) {
    // Supabase resolves rather than rejects when the request never reached
    // the server, handing back an AuthRetryableFetchError whose message is
    // the raw "fetch failed". Without this branch that string is what the
    // user reads on the login screen.
    if (isAuthRetryableFetchError(authError)) {
      console.error("[auth] sign-in could not reach Supabase:", authError.message);
      return { error: UNREACHABLE };
    }

    if (authError.message === SUPABASE_BAD_CREDENTIALS) {
      return { error: "Wrong email or password." };
    }

    // Anything else — rate limiting, an unconfirmed email, a project
    // misconfiguration. Supabase's own wording is user-facing enough to show,
    // but it is logged too, since the message alone rarely says which.
    console.error("[auth] sign-in failed:", authError.message);
    return { error: authError.message };
  }

  // Outside the try/catch on purpose: redirect() signals by throwing, and a
  // catch here would swallow it and report a phantom connection error.
  redirect(safeNext(formData.get("next")));
}

/**
 * Where to land after signing in — the page the proxy interrupted, if any.
 *
 * The value arrives from a query string, so it is attacker-controllable: any
 * absolute URL ("https://evil.example") or scheme-relative one ("//evil")
 * would turn our own login form into an open redirect. Only a single-slash
 * relative path is accepted; anything else falls back to the default section.
 */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/activities/open";
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
