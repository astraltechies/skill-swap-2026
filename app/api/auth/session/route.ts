import { apiError, HandledError, ok } from "@/lib/api";
import {
  adminAuth,
  createSessionCookie,
  getSessionClaims,
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
} from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { z } from "zod";

const bodySchema = z.object({ idToken: z.string().min(20) });

/**
 * Trades a fresh Firebase ID token for an httpOnly session cookie.
 *
 * The browser never keeps a token it can read: JavaScript on the page — or
 * anything injected into it — cannot lift this cookie, and the server can
 * revoke it centrally, which a client-held ID token does not allow.
 */
export async function POST(request: Request) {
  try {
    const { idToken } = bodySchema.parse(await request.json());
    const cookie = await createSessionCookie(idToken);

    (await cookies()).set(SESSION_COOKIE, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_MS / 1000,
    });

    return ok();
  } catch (error) {
    if (error instanceof Error && error.message.includes("Sign in again")) {
      return apiError(new HandledError(error.message, 401));
    }
    // Never echo the Firebase error back — it distinguishes "no such user"
    // from "wrong token", which is an account-enumeration hint.
    return apiError(new HandledError("Could not start a session.", 401));
  }
}

/** Sign out. Revokes server-side too, so the cookie cannot be replayed. */
export async function DELETE() {
  try {
    const claims = await getSessionClaims();
    if (claims) {
      await adminAuth().revokeRefreshTokens(claims.sub);
    }
  } catch {
    // Revocation is best-effort; clearing the cookie is what must not fail.
  }

  (await cookies()).delete(SESSION_COOKIE);
  return ok();
}
