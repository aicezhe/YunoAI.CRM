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

  // getUser() revalidates the token against Supabase Auth. getSession() only
  // decodes whatever cookie the browser sent, which is spoofable — never use
  // it to decide whether someone is signed in.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const profile = await getUserProfile(user.id);

  return {
    id: user.id,
    email: user.email,
    name:
      profile?.name ??
      (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ??
      user.email.split("@")[0],
    role: profile?.role ?? parseRole(user.app_metadata?.role),
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
