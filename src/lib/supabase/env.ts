import "server-only";

/**
 * Supabase configuration, read once and validated at first import.
 *
 * These use Supabase's current key names, not the legacy anon/service_role
 * pair: the publishable key is safe to expose and gates on Row Level
 * Security. `server-only` makes an accidental import from a Client Component
 * a build error rather than a leak.
 *
 * The secret key is deliberately absent. It bypasses RLS, and the only thing
 * that needs it is the seeding scripts — which read it from the environment
 * themselves, outside the app, so no request path can reach it.
 *
 * Reading a missing key would otherwise surface as a confusing runtime
 * failure deep inside the Supabase SDK ("Invalid URL"), so a missing variable
 * fails loudly and names itself instead.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill it in from ` +
        `your Supabase project (Project Settings -> API).`,
    );
  }
  return value;
}

export const SUPABASE_URL = required("SUPABASE_URL");
export const SUPABASE_PUBLISHABLE_KEY = required("SUPABASE_PUBLISHABLE_KEY");
