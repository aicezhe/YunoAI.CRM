import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type Result } from "./types";

export type UserOption = { id: string; name: string };

/** For the "Owner" picker on every create form — organizations, people and
 *  deals all have an owner_id, and the whole team can be assigned any of
 *  them (see the RLS policies: this is a small shared-pipeline CRM, not one
 *  where reps only see their own book). */
export async function listUsers(): Promise<Result<UserOption[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("users").select("id, name").order("name");

  if (error) return fail("listUsers", error.message);
  return ok(data);
}
