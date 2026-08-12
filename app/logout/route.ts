import { adminAuth, getSessionClaims, SESSION_COOKIE } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Clears the session and sends the user back to sign in.
 *
 * This exists because a Server Component cannot delete a cookie. Without it,
 * a cookie that is present but no longer verifies — revoked by a ban, expired
 * after two weeks, or left over from a different Firebase project — puts the
 * browser in a loop: `proxy.ts` sees the cookie and allows `/dashboard`, the
 * app layout fails to resolve a user and redirects to `/login`, and `proxy.ts`
 * sees the cookie again and bounces straight back. Routing that dead end
 * through here breaks the cycle by actually removing the cookie.
 */
export async function GET(request: Request) {
  try {
    const claims = await getSessionClaims();
    if (claims) await adminAuth().revokeRefreshTokens(claims.sub);
  } catch {
    // Revocation is best-effort. Clearing the cookie is what must not fail.
  }

  const store = await cookies();
  store.delete(SESSION_COOKIE);

  const reason = new URL(request.url).searchParams.get("reason");
  const login = new URL("/login", request.url);
  if (reason) login.searchParams.set(reason, "1");

  return NextResponse.redirect(login);
}
