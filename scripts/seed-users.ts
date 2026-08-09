/**
 * Creates the demo accounts.
 *
 * These cannot be seeded from SQL. public.users.id is a foreign key onto
 * auth.users.id, and a row inserted into auth.users by hand has no usable
 * password hash — nobody could sign in with it. So each account is created
 * through the Admin API, the trigger from migration 0001 writes the matching
 * profile, and this script then sets the role.
 *
 * Idempotent: re-running against existing accounts re-applies name and role
 * and leaves passwords alone.
 *
 *   npm run seed:users
 *
 * The credentials below are throwaway logins for a demo database on a
 * disposable Supabase project, deliberately checked in so a reviewer can sign
 * in without being sent a password separately. Nothing real is behind them.
 * If this schema is ever pointed at data that matters, delete these accounts.
 */
import { createClient } from "@supabase/supabase-js";

type SeedUser = {
  email: string;
  password: string;
  name: string;
  role: "admin" | "member";
};

const USERS: SeedUser[] = [
  {
    email: "camillo@yunocrm.test",
    password: "YUQLQTKcf63eCQKTnw",
    name: "Camillo",
    role: "admin",
  },
  {
    email: "anna@yunocrm.test",
    password: "4gsX2s5Lx6kAVfjNTk",
    name: "Anna",
    role: "member",
  },
  {
    email: "marco@yunocrm.test",
    password: "VuEDKSwiTunTnCwY87",
    name: "Marco",
    role: "member",
  },
  {
    email: "giulia@yunocrm.test",
    password: "mSQfAufnedzg37QTi9",
    name: "Giulia",
    role: "member",
  },
];

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. Fill in .env.local first.`);
    process.exit(1);
  }
  return value;
}

// The secret key bypasses RLS and can mint accounts. It never leaves the
// server, and this script is the reason it is in .env.local at all.
const admin = createClient(required("SUPABASE_URL"), required("SUPABASE_SECRET_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** The Admin API has no get-by-email, so page through until it turns up. */
async function findUserIdByEmail(target: string): Promise<string | null> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const match = data.users.find((u) => u.email?.toLowerCase() === target.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function seed(user: SeedUser): Promise<void> {
  const { data, error } = await admin.auth.admin.createUser({
    email: user.email,
    password: user.password,
    // Without this the account sits unconfirmed and sign-in fails with
    // "Email not confirmed" — there is no inbox behind a .test domain.
    email_confirm: true,
    // The trigger reads this for the display name.
    user_metadata: { name: user.name },
  });

  let userId: string;
  if (error) {
    // Already registered is the expected path on a re-run, not a failure.
    const existing = await findUserIdByEmail(user.email);
    if (!existing) throw new Error(`createUser(${user.email}) failed: ${error.message}`);
    userId = existing;
  } else {
    userId = data.user.id;
  }

  // The trigger inserted the profile as 'member'. Set the intended name and
  // role — an update rather than an upsert, because on the normal path the row
  // is already there and the insert below only covers an account that predates
  // migration 0001.
  const { data: updated, error: updateError } = await admin
    .from("users")
    .update({ role: user.role, name: user.name })
    .eq("id", userId)
    .select("id");

  if (updateError) throw new Error(`${user.email}: ${updateError.message}`);

  if (updated.length === 0) {
    const { error: insertError } = await admin
      .from("users")
      .insert({ id: userId, email: user.email, name: user.name, role: user.role });
    if (insertError) throw new Error(`${user.email}: ${insertError.message}`);
  }

  console.log(`  ${user.role.padEnd(6)}  ${user.name.padEnd(8)}  ${user.email}`);
}

async function main() {
  console.log("Seeding demo accounts:");
  for (const user of USERS) await seed(user);
  console.log(`\n${USERS.length} accounts ready.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
