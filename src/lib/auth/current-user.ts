import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "./profile";
import { parseRole, type AppRole } from "./roles";

export type CurrentUser = {
  id: string;
  email: string;
  /** Display name — profile row, then auth metadata, then the email's local part. */
  name: string;
  role: AppRole;
};

/**
 * The signed-in user, or null.
 *
 * Wrapped in React's `cache()` so it costs at most one auth round-trip per
 * request no matter how many Server Components ask: the (app) layout and the
 * page rendering inside it both call this, and without the cache that is two
 * network calls to Supabase Auth for every single page view.
 *
 * Role resolution walks three sources, most authoritative first:
 *   1. the `users` table — not migrated yet, see profile.ts
 *   2. `app_metadata.role` on the auth record — settable by hand from the
 *      Supabase Dashboard, which is how admin/member can be exercised today
 *   3. "member"
 *
 * `app_metadata` rather than `user_metadata` on purpose: users can rewrite
 * their own user_metadata through the Auth API, so trusting it for a role
 * would let any account promote itself to admin.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();

  // getClaims() verifies the JWT's signature locally against the project's
  // public key; getUser() would post to Supabase Auth instead, a second
  // network round-trip on top of the one proxy.ts already makes, on every
  // page view. Verified either way — what changes is where.
  //
  // Never getSession(): that decodes the cookie without checking the
  // signature, so a forged one would pass.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const id = typeof claims?.sub === "string" ? claims.sub : null;
  const email = typeof claims?.email === "string" ? claims.email : null;
  if (!id || !email) return null;

  const profile = await getUserProfile(id);

  // The claims carry app_metadata and user_metadata as they stood when the
  // token was issued, so a role changed in the last hour is stale here. That
  // is only the fallback path: once the users table has a row, the profile
  // lookup above wins and is always current.
  const metadata = claims as { user_metadata?: unknown; app_metadata?: unknown };
  const userMetaName =
    typeof (metadata.user_metadata as { name?: unknown })?.name === "string"
      ? ((metadata.user_metadata as { name: string }).name)
      : null;

  return {
    id,
    email,
    name: profile?.name ?? userMetaName ?? email.split("@")[0],
    role: profile?.role ?? parseRole((metadata.app_metadata as { role?: unknown })?.role),
  };
});

/**
 * Same as {@link getCurrentUser}, but redirects instead of returning null.
 *
 * proxy.ts already bounces anonymous requests, so reaching this without a
 * session means the session expired between the proxy check and the render.
 * Server Components still call it rather than trusting the proxy: the proxy
 * is an optimistic check, and authorization belongs next to the data.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function isAdmin(): Promise<boolean> {
  return (await getCurrentUser())?.role === "admin";
}
