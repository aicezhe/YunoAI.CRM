import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

/**
 * Supabase client bound to the request's cookie jar — the only Supabase
 * client in the app.
 *
 * v1 also shipped a browser client (`createBrowserClient`), which forced the
 * project URL and key to be `NEXT_PUBLIC_`-prefixed so Next would inline them
 * into the client bundle. v2 uses the new Supabase key names
 * (SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY) with no prefix, so nothing
 * reaches the browser: sign-in and sign-out run as Server Actions instead.
 * Cookies still carry the session exactly as before.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component, where the cookie jar is
          // read-only. Safe to swallow: proxy.ts refreshes the session on
          // every request, so a rotated token is never lost.
        }
      },
    },
  });
}
