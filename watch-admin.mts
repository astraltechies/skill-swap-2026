import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({ credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\n/g, "\n"),
  })});
}

const EMAIL = "astral.techies@gmail.com";
const db = getFirestore();
const deadline = Date.now() + 20 * 60 * 1000;

while (Date.now() < deadline) {
  try {
    const user = await getAuth().getUserByEmail(EMAIL);
    const ref = db.collection("users").doc(user.uid);
    const doc = await ref.get();
    if (doc.exists) {
      const data = doc.data()!;
      if (data.role !== "admin") {
        await ref.update({ role: "admin", updatedAt: Date.now() });
        await db.collection("adminActions").add({
          adminId: "script:make-admin",
          actionType: "promote_admin",
          targetId: user.uid,
          notes: "Initial admin, promoted by watcher after Google signup",
          createdAt: Date.now(),
        });
      }
      console.log(`PROMOTED @${data.username} (${data.displayName}) to admin`);
      process.exit(0);
    }
    console.log("signed in with Google, waiting for the consent step to finish...");
  } catch {
    // no account yet
  }
  await new Promise((r) => setTimeout(r, 10000));
}
console.log("TIMEOUT: no account appeared in 20 minutes");
process.exit(1);
