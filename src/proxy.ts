import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Reachable without a session. Everything else redirects to /login. */
const PUBLIC_PATHS = ["/login"];

/** Where a signed-in user lands when they hit "/" or /login. Activities is
 *  the default section: it is the list of what is actually owed today. */
const HOME = "/activities/open";

/**
 * Runs before every request (Next 16 renamed this file from `middleware.ts`
 * to `proxy.ts`; the named export must be `proxy`).
 *
 * Two jobs. It refreshes the Supabase session so a rotated access token gets
 * written back to the cookie jar — without this, sessions silently expire
 * mid-use. And it does the coarse signed-in/signed-out routing so anonymous
 * visitors never see a protected page render at all.
 *
 * This is an optimistic check, not the authorization boundary: the real one
 * is requireUser() in the (app) layout, next to the data it protects.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims(), not getUser(). getUser() posts to Supabase Auth on every
  // single request — and this runs on every navigation and every RSC fetch,
  // so it was adding 130–390ms to each one, more than the page's own queries.
  // getClaims() verifies the JWT's signature locally against the project's
  // public key (cached after the first fetch), which is what the asymmetric
  // keys exist for. It still refreshes an expired session through the cookie
  // handlers above, so the reason this file exists is unaffected.
  //
  // Not getSession(): that decodes the cookie without verifying it, which is
  // forgeable. The verification is the whole point.
  //
  // On a project still signing with a symmetric key, getClaims() falls back
  // to getUser() by itself, so this is never less safe than what it replaced
  // — only slower, exactly as before.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // So the user returns to where they were headed after signing in.
    if (path !== "/") url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && (isPublic || path === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = HOME;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Everything except Next internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
