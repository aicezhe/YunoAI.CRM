import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Reachable without a session. Everything else redirects to /login. */
const PUBLIC_PATHS = ["/login"];

/** Where a signed-in user lands when they hit "/" or /login. */
const HOME = "/dashboard";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
