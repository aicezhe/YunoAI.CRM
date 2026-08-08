/**
 * Creates the first admin account.
 *
 * This cannot be a SQL seed. public.users.id is a foreign key onto
 * auth.users.id, and auth.users is owned by GoTrue — a row inserted there by
 * hand has no usable password hash and cannot be signed into. So the account
 * is created through the Admin API, the trigger from migration 0001 writes the
 * matching profile, and this script then promotes it.
 *
 * Idempotent: re-running against an existing account just re-promotes it.
 *
 *   SEED_ADMIN_EMAIL=you@company.com SEED_ADMIN_PASSWORD='…' \
 *     npm run seed:admin
 */
import { createClient } from "@supabase/supabase-js";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}.`);
    process.exit(1);
  }
  return value;
}

const url = required("SUPABASE_URL");
// The secret key bypasses RLS and can mint accounts — it never leaves the
// server, and this script is the reason it exists in .env.local at all.
const secretKey = required("SUPABASE_SECRET_KEY");
const email = required("SEED_ADMIN_EMAIL");
const password = required("SEED_ADMIN_PASSWORD");

const admin = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserIdByEmail(target: string): Promise<string | null> {
  // The Admin API has no get-by-email, so page through until it turns up.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const match = data.users.find((u) => u.email?.toLowerCase() === target.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function main() {
  let userId: string;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    // Without this the account sits unconfirmed and sign-in fails with
    // "Email not confirmed" — there is no inbox to click through here.
    email_confirm: true,
  });

  if (error) {
    // Already registered is the expected path on a re-run, not a failure.
    const existingId = await findUserIdByEmail(email);
    if (!existingId) throw new Error(`createUser failed: ${error.message}`);
    userId = existingId;
    console.log(`Auth account already exists: ${email}`);
  } else {
    userId = data.user.id;
    console.log(`Created auth account: ${email}`);
  }

  // The trigger inserted the profile as 'member'. Promote it.
  //
  // update-then-insert rather than upsert: on the normal path the row is
  // already there, and an upsert would need to restate name and email, which
  // the trigger derives. The insert only covers an account created before
  // migration 0001 existed.
  const { data: updated, error: updateError } = await admin
    .from("users")
    .update({ role: "admin" })
    .eq("id", userId)
    .select("id");

  if (updateError) throw new Error(`promote failed: ${updateError.message}`);

  if (updated.length === 0) {
    const { error: insertError } = await admin.from("users").insert({
      id: userId,
      email,
      name: email.split("@")[0],
      role: "admin",
    });
    if (insertError) throw new Error(`profile insert failed: ${insertError.message}`);
    console.log("Created missing profile row as admin.");
  } else {
    console.log("Promoted to admin.");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
