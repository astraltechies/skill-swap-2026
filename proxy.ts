import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "__session";

/** Signed-in area. Anything under these prefixes needs a session. */
const PROTECTED = [
  "/dashboard",
  "/profile",
  "/browse",
  "/matches",
  "/sessions",
  "/chat",
  "/wallet",
  "/skillbot",
  "/leaderboard",
  "/notifications",
  "/admin",
];

/** Signed-in users get bounced away from these. */
const AUTH_ONLY = ["/login", "/signup"];

/**
 * Paths that must stay reachable even with a session cookie present.
 *
 * `/logout` because it is the only thing that can clear a cookie that no longer
 * verifies — bouncing it would recreate the redirect loop it exists to break.
 *
 * `/signup/complete` because a Google sign-in legitimately has a session but no
 * profile yet, and that page is where the profile gets created. It also has to
 * be listed here explicitly: it starts with "/signup", so the AUTH_ONLY prefix
 * match below would otherwise catch it and send the user to /dashboard, which
 * finds no profile and bounces them straight back out to /login.
 */
const ALWAYS_ALLOWED = ["/logout", "/signup/complete"];

/**
 * An optimistic gate, not the authorisation check.
 *
 * This only looks at whether a session cookie is present, because verifying it
 * properly means a network call on every single request. The real check — is
 * the cookie valid, is the account banned, is this person actually an admin —
 * happens in the layouts and route handlers via `requireUser`/`requireAdmin`,
 * which is where a forged cookie gets rejected. Treat this purely as a
 * redirect for a better experience.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (ALWAYS_ALLOWED.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (!hasSession && PROTECTED.some((p) => pathname.startsWith(p))) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  if (hasSession && AUTH_ONLY.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image optimisation, which never
     * carry a session and would only add latency.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)",
  ],
};
