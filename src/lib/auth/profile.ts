import "server-only";
import type { AppRole } from "./roles";

export type UserProfile = {
  name: string;
  role: AppRole;
};

/**
 * App-level profile for a Supabase auth user — the row that will live in the
 * `users` table once migrations land.
 *
 * Until then this returns null and {@link getCurrentUser} falls back to the
 * auth record itself (see current-user.ts). Wiring the real table up is meant
 * to be a single-function change: swap the body for the commented query
 * below and nothing else in the app moves, because every caller already goes
 * through getCurrentUser().
 *
 * Returning null (rather than throwing) is also the shape a genuinely missing
 * row should have later — a user that exists in Supabase Auth but has no
 * profile row yet is a normal state, not an error.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  void userId;

  // --- Enable once the `users` migration exists -------------------------
  // const supabase = await createClient();
  // const { data, error } = await supabase
  //   .from("users")
  //   .select("name, role")
  //   .eq("id", userId)
  //   .maybeSingle();
  //
  // // A lookup failure degrades to the auth-record fallback rather than
  // // taking down every authenticated page: this is called from the (app)
  // // layout, so an uncaught throw here blanks the whole shell.
  // if (error) {
  //   console.error("[auth] profile lookup failed:", error.message);
  //   return null;
  // }
  // if (!data) return null;
  // return { name: data.name, role: parseRole(data.role) };
  // ----------------------------------------------------------------------

  return null;
}
