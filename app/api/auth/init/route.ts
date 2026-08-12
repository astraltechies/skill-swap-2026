import { apiError, HandledError, ok, parseBody } from "@/lib/api";
import { applyCoinDelta } from "@/lib/coins/ledger";
import { COINS, POLICY_VERSION } from "@/lib/constants";
import { adminDb, getSessionClaims } from "@/lib/firebase/admin";
import { initAccountSchema } from "@/lib/validation/schemas";
import { COLLECTIONS, type UserProfile } from "@/types/firestore";

/**
 * Creates the account record after Firebase Auth has issued an identity.
 *
 * Runs as one transaction so the four things that must be true together —
 * the username is taken, the profile exists, consent is on file, and the
 * opening balance is on the ledger — either all happen or none do.
 */
export async function POST(request: Request) {
  try {
    const claims = await getSessionClaims();
    if (!claims) throw new HandledError("Sign in to continue.", 401);

    const input = await parseBody(request, initAccountSchema);
    const db = adminDb();
    const now = Date.now();

    const userRef = db.collection(COLLECTIONS.users).doc(claims.uid);
    const usernameRef = db.collection(COLLECTIONS.usernames).doc(input.username);

    await db.runTransaction(async (tx) => {
      const [existingUser, existingUsername] = await Promise.all([
        tx.get(userRef),
        tx.get(usernameRef),
      ]);

      if (existingUser.exists) {
        throw new HandledError("This account is already set up.", 409);
      }
      if (existingUsername.exists) {
        throw new HandledError("That username is already taken.", 409);
      }

      const profile: UserProfile = {
        uid: claims.uid,
        displayName: input.displayName,
        username: input.username,
        photoURL: (claims.picture as string | undefined) ?? null,
        bio: "",
        city: input.city,
        role: "student",
        status: "active",
        ageConfirmed: true,
        guardianConsent: {
          given: true,
          guardianName: input.guardianName,
          guardianEmail: input.guardianEmail,
          consentedAt: now,
          policyVersion: POLICY_VERSION,
        },
        skillsTeach: [],
        skillsLearn: [],
        availability: [],
        isTeaching: false,
        coinBalance: 0,
        ratingAvg: 0,
        ratingCount: 0,
        sessionsTaught: 0,
        sessionsLearned: 0,
        reportCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      tx.create(userRef, profile);
      tx.create(usernameRef, { uid: claims.uid, createdAt: now });

      // The append-only record that actually evidences consent. The copy on
      // the user doc is a convenience for rules and UI; this one is the log.
      tx.create(db.collection(COLLECTIONS.consentRecords).doc(), {
        uid: claims.uid,
        ageConfirmed: true,
        guardianName: input.guardianName,
        guardianEmail: input.guardianEmail,
        policyVersion: POLICY_VERSION,
        consentedAt: now,
        userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? "",
      });

      applyCoinDelta(tx, {
        userId: claims.uid,
        currentBalance: 0,
        amount: COINS.welcomeBonus,
        type: "welcome_bonus",
        description: "Welcome to Skill Swap",
      });
    });

    return ok({ username: input.username });
  } catch (error) {
    return apiError(error);
  }
}
