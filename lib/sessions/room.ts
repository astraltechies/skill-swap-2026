import { createHash } from "node:crypto";

/**
 * Jitsi rooms are public to anyone who knows the name, so the name must not be
 * guessable from the session id. Hashing with a server-side secret means a
 * leaked session id alone does not let someone walk into the call.
 */
export function roomIdFor(sessionId: string): string {
  const secret = process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "skill-swap-dev";
  return (
    "swap-" +
    createHash("sha256").update(`${sessionId}:${secret}`).digest("hex").slice(0, 24)
  );
}
