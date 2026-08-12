import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { HandledError } from "@/lib/api";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Fixed-window rate limit, counted per user per hour in Firestore.
 *
 * A fixed window lets through up to 2x the limit across a window boundary,
 * which is fine here — the point is to stop one account burning a shared free
 * tier, not to meter precisely.
 */
export async function enforceRateLimit(params: {
  uid: string;
  action: string;
  limit: number;
}): Promise<void> {
  const windowKey = Math.floor(Date.now() / (1000 * 60 * 60));
  const ref = adminDb()
    .collection("rateLimits")
    .doc(`${params.action}_${params.uid}_${windowKey}`);

  const count = await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = (snap.data()?.count as number | undefined) ?? 0;

    if (current >= params.limit) return current;

    tx.set(
      ref,
      {
        count: FieldValue.increment(1),
        uid: params.uid,
        action: params.action,
        // Lets a TTL policy on this field clean up old windows automatically.
        expiresAt: new Date((windowKey + 2) * 1000 * 60 * 60),
      },
      { merge: true },
    );

    return current + 1;
  });

  if (count > params.limit) {
    throw new HandledError(
      "You've hit the hourly limit for this. Try again a bit later.",
      429,
    );
  }
}
