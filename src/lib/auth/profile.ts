import "server-only";
import { createClient } from "@/lib/supabase/server";
import { parseRole, type AppRole } from "./roles";

export type UserProfile = {
  name: string;
  role: AppRole;
};

/**
 * App-level profile for a Supabase auth user — the `users` row from migration
 * 0001, which is keyed by the auth user's own id.
 *
 * Returns null rather than throwing when the row is missing: an account that
 * exists in Supabase Auth without a profile is a normal state, not an error
 * (it happens for accounts created before the trigger existed). getCurrentUser
 * falls back to the auth record in that case.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("name, role")
    .eq("id", userId)
    .maybeSingle();

  // A lookup failure degrades to the same fallback rather than taking down
  // every authenticated page: this runs from the (app) layout, so an uncaught
  // throw here blanks the whole shell — including screens whose own data loads
  // fine. Failing to 'member' is also the safe direction: it can under-grant,
  // never over-grant.
  if (error) {
    console.error("[auth] profile lookup failed:", error.message);
    return null;
  }

  if (!data) return null;
  return { name: data.name, role: parseRole(data.role) };
}
