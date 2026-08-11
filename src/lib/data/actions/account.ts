"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin, requireUser } from "@/lib/auth/current-user";
import { isAppRole } from "@/lib/auth/roles";

/**
 * Server Actions for a user's own account (display name, password) and
 * for the one thing an admin does to somebody else's: their role.
 */

export type ProfileNameState = { error: string | null; name: string };

/**
 * Renames the signed-in user — nobody else's row, and nothing but the name.
 *
 * That restriction is enforced twice, deliberately. requireUser() plus the
 * .eq("id", user.id) below stop this action from ever being called against
 * another id, and the migration 0012 policy stops the request even if it
 * somehow reached the database with a different id or an extra field —
 * belt and braces around the one write a member is allowed to make to their
 * own row.
 */
export async function updateProfileName(
  _prevState: ProfileNameState,
  formData: FormData,
): Promise<ProfileNameState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Enter a name.", name };

  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("users").update({ name }).eq("id", user.id);

  if (error) {
    console.error("[users] rename failed:", error.message);
    return { error: "Could not save your name. Try again.", name };
  }

  // Every screen that shows a name — the sidebar, every Owner column, every
  // record this person owns — reads it from this one row.
  revalidatePath("/", "layout");
  return { error: null, name };
}

export type PasswordState = { error: string | null; done: boolean };

/**
 * Sets a new password for the signed-in user.
 *
 * No "current password" re-check: getting here already required a valid
 * session (the (app) layout's requireUser()), and Supabase Auth's own
 * updateUser() call is what actually performs the change — there is no
 * separate public.users write for RLS to gate, so migration 0012 is
 * unrelated to this path.
 */
export async function updatePassword(
  _prevState: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) return { error: "Use at least 8 characters.", done: false };
  if (password !== confirm) return { error: "Passwords don't match.", done: false };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("[auth] password update failed:", error.message);
    return { error: "Could not update your password. Try again.", done: false };
  }

  return { error: null, done: true };
}

/**
 * Admin-only: changes a teammate's role.
 *
 * isAdmin() is checked here even though migration 0010's users_write_admin
 * policy would reject the write anyway — the same "boundary" reasoning as
 * everywhere else in this file: the database is the real enforcement, but
 * failing before the query names the actual problem ("not an admin")
 * instead of a generic Postgres permission error.
 *
 * A caller cannot change their own role, admin or not. Nothing in the
 * schema stops a lone admin demoting themselves to member and locking the
 * team out of the one screen that grants admin back — since promoting
 * requires being an admin already, that lockout has no recovery path short
 * of the Supabase Dashboard. Refusing it here is cheaper than a "you are
 * the last admin" check that has to stay correct as the team grows.
 */
export async function setUserRole(userId: string, role: string): Promise<void> {
  if (!(await isAdmin())) throw new Error("Only admins can change roles.");
  if (!isAppRole(role)) throw new Error("Not a real role.");

  const user = await requireUser();
  if (userId === user.id) throw new Error("You can't change your own role.");

  const supabase = await createClient();
  const { error } = await supabase.from("users").update({ role }).eq("id", userId);

  if (error) {
    console.error("[users] role change failed:", error.message);
    throw new Error("Could not change this person's role.");
  }

  revalidatePath("/", "layout");
}
