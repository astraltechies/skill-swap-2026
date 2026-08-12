/**
 * Seeds Firestore.
 *
 *   node --env-file=.env.local scripts/seed.mts          catalogue only
 *   node --env-file=.env.local scripts/seed.mts --demo   catalogue + demo students
 *
 * The catalogue is safe to run against production — it only upserts skill
 * categories, skills and the badge definitions. `--demo` additionally creates
 * sign-innable accounts with a shared password, so it refuses to run unless
 * SEED_ALLOW_DEMO=yes is set.
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { CATALOGUE } from "./catalogue.mts";

const DEMO = process.argv.includes("--demo");
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "swapdemo2026";
const POLICY_VERSION = "2026-01-v1";
const WELCOME_BONUS = 60;
const SESSION_COST = 25;

const BADGES = [
  { id: "first_lesson", name: "First Lesson", description: "Taught your first session.", emoji: "🌱" },
  { id: "first_swap", name: "First Swap", description: "Taught someone and learned from someone.", emoji: "🔄" },
  { id: "five_taught", name: "Regular", description: "Taught five sessions.", emoji: "⭐" },
  { id: "ten_taught", name: "Mentor", description: "Taught ten sessions.", emoji: "🏆" },
  { id: "well_rated", name: "Well Rated", description: "Held a 4.5+ rating across five or more reviews.", emoji: "💎" },
  { id: "polymath", name: "Polymath", description: "Teaching three or more different skills.", emoji: "🧠" },
];

interface DemoStudent {
  username: string;
  displayName: string;
  city: string;
  bio: string;
  teach: [string, "beginner" | "intermediate" | "advanced"][];
  learn: string[];
  ratingAvg: number;
  ratingCount: number;
  sessionsTaught: number;
  sessionsLearned: number;
}

/** Skills are referenced by slug; the runner maps them to generated ids. */
const DEMO_STUDENTS: DemoStudent[] = [
  {
    username: "aarav_s", displayName: "Aarav Sharma", city: "Jaipur",
    bio: "Class 11. I've been writing Python since Class 8 and I like explaining the bits that textbooks rush past.",
    teach: [["python", "advanced"], ["mathematics", "intermediate"]], learn: ["guitar", "photography"],
    ratingAvg: 4.8, ratingCount: 12, sessionsTaught: 14, sessionsLearned: 3,
  },
  {
    username: "diya_m", displayName: "Diya Mehta", city: "Pune",
    bio: "Guitarist, mostly fingerstyle. Happy to start you from zero — I did too, two years ago.",
    teach: [["guitar", "advanced"], ["singing", "intermediate"]], learn: ["python", "digital-art"],
    ratingAvg: 4.9, ratingCount: 18, sessionsTaught: 21, sessionsLearned: 5,
  },
  {
    username: "kabir_r", displayName: "Kabir Raina", city: "Delhi",
    bio: "Physics and chess. I think most people find physics hard because nobody drew them the picture.",
    teach: [["physics", "advanced"], ["chess", "advanced"], ["mathematics", "advanced"]], learn: ["public-speaking", "cooking"],
    ratingAvg: 4.7, ratingCount: 9, sessionsTaught: 11, sessionsLearned: 4,
  },
  {
    username: "ananya_k", displayName: "Ananya Krishnan", city: "Chennai",
    bio: "I sketch every day and I'm slowly getting good at digital. Ask me about shading.",
    teach: [["sketching", "advanced"], ["digital-art", "intermediate"]], learn: ["singing", "web-development"],
    ratingAvg: 5.0, ratingCount: 7, sessionsTaught: 8, sessionsLearned: 6,
  },
  {
    username: "rohan_p", displayName: "Rohan Patil", city: "Mumbai",
    bio: "Built two small games in Scratch and now moving to real code. Also captain of the football team.",
    teach: [["scratch", "advanced"], ["football", "advanced"]], learn: ["python", "graphic-design"],
    ratingAvg: 4.4, ratingCount: 5, sessionsTaught: 6, sessionsLearned: 7,
  },
  {
    username: "ishita_v", displayName: "Ishita Verma", city: "Lucknow",
    bio: "Debate team. If you go blank in front of a class, I can help with that — it used to happen to me.",
    teach: [["public-speaking", "advanced"], ["english-speaking", "advanced"]], learn: ["keyboard", "financial-literacy"],
    ratingAvg: 4.9, ratingCount: 15, sessionsTaught: 17, sessionsLearned: 2,
  },
  {
    username: "vihaan_j", displayName: "Vihaan Joshi", city: "Ahmedabad",
    bio: "Chemistry olympiad prep. Organic mechanisms are my favourite thing to teach.",
    teach: [["chemistry", "advanced"], ["biology", "intermediate"]], learn: ["music-production", "japanese"],
    ratingAvg: 4.6, ratingCount: 8, sessionsTaught: 9, sessionsLearned: 3,
  },
  {
    username: "meera_n", displayName: "Meera Nair", city: "Kochi",
    bio: "Learning tabla since I was six. Also good at breaking down maths problems.",
    teach: [["tabla", "advanced"], ["mathematics", "intermediate"]], learn: ["sketching", "python"],
    ratingAvg: 4.8, ratingCount: 11, sessionsTaught: 12, sessionsLearned: 5,
  },
  {
    username: "arjun_g", displayName: "Arjun Gupta", city: "Bengaluru",
    bio: "Made my school's website. Happy to walk anyone through HTML and CSS.",
    teach: [["web-development", "advanced"], ["graphic-design", "intermediate"]], learn: ["guitar", "yoga"],
    ratingAvg: 4.5, ratingCount: 6, sessionsTaught: 7, sessionsLearned: 4,
  },
  {
    username: "sara_q", displayName: "Sara Qureshi", city: "Hyderabad",
    bio: "Photography and a lot of walking around the old city. Phone camera is enough to start.",
    teach: [["photography", "advanced"], ["digital-art", "beginner"]], learn: ["economics", "dance"],
    ratingAvg: 4.7, ratingCount: 10, sessionsTaught: 11, sessionsLearned: 6,
  },
  {
    username: "neel_b", displayName: "Neel Bhatt", city: "Surat",
    bio: "Keyboard, mostly film music. I can get you playing with both hands in a few sessions.",
    teach: [["keyboard", "advanced"], ["music-production", "intermediate"]], learn: ["public-speaking", "chess"],
    ratingAvg: 4.6, ratingCount: 9, sessionsTaught: 10, sessionsLearned: 3,
  },
  {
    username: "tara_d", displayName: "Tara Desai", city: "Nagpur",
    bio: "Class 12 commerce. Economics finally clicked for me last year and I want to save people the confusion.",
    teach: [["economics", "advanced"], ["financial-literacy", "intermediate"]], learn: ["web-development", "french"],
    ratingAvg: 4.9, ratingCount: 13, sessionsTaught: 15, sessionsLearned: 4,
  },
  {
    username: "zoya_a", displayName: "Zoya Ahmed", city: "Bhopal",
    bio: "French since Class 6, plus a bit of Japanese from anime. No judgement about accents here.",
    teach: [["french", "advanced"], ["japanese", "beginner"]], learn: ["sketching", "study-skills"],
    ratingAvg: 4.8, ratingCount: 7, sessionsTaught: 8, sessionsLearned: 5,
  },
  {
    username: "dev_s", displayName: "Dev Suresh", city: "Coimbatore",
    bio: "Yoga every morning before school. Good for the exam-season back pain, honestly.",
    teach: [["yoga", "advanced"], ["study-skills", "intermediate"]], learn: ["cricket", "ai-basics"],
    ratingAvg: 4.5, ratingCount: 4, sessionsTaught: 5, sessionsLearned: 8,
  },
];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`\n  Missing ${name}. Run with: node --env-file=.env.local scripts/seed.mts\n`);
    process.exit(1);
  }
  return value;
}

function init() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: requireEnv("FIREBASE_ADMIN_PROJECT_ID"),
        clientEmail: requireEnv("FIREBASE_ADMIN_CLIENT_EMAIL"),
        privateKey: requireEnv("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n"),
      }),
    });
  }
  return { db: getFirestore(), auth: getAuth() };
}

async function seedCatalogue(db: FirebaseFirestore.Firestore) {
  const skillIdBySlug = new Map<string, string>();
  let batch = db.batch();
  let writes = 0;

  const commitIfFull = async () => {
    if (++writes >= 400) {
      await batch.commit();
      batch = db.batch();
      writes = 0;
    }
  };

  for (const [index, category] of CATALOGUE.entries()) {
    const categoryRef = db.collection("skillCategories").doc(category.slug);
    batch.set(
      categoryRef,
      {
        name: category.name,
        slug: category.slug,
        description: category.description,
        emoji: category.emoji,
        featured: category.featured,
        order: index,
      },
      { merge: true },
    );
    await commitIfFull();

    for (const skill of category.skills) {
      const skillRef = db.collection("skills").doc(skill.slug);
      skillIdBySlug.set(skill.slug, skill.slug);
      batch.set(
        skillRef,
        {
          name: skill.name,
          slug: skill.slug,
          categoryId: category.slug,
          description: skill.description,
          tags: skill.tags,
          featured: category.featured,
          // Left alone on re-runs so a real count is never overwritten.
          teacherCount: 0,
        },
        { mergeFields: ["name", "slug", "categoryId", "description", "tags", "featured"] },
      );
      await commitIfFull();
    }
  }

  for (const badge of BADGES) {
    batch.set(db.collection("badges").doc(badge.id), badge, { merge: true });
    await commitIfFull();
  }

  batch.set(
    db.collection("siteConfig").doc("policyVersions"),
    { privacyVersion: POLICY_VERSION, termsVersion: POLICY_VERSION, effectiveDate: Date.now() },
    { merge: true },
  );

  await batch.commit();

  const skillCount = CATALOGUE.reduce((n, c) => n + c.skills.length, 0);
  console.log(`  ${CATALOGUE.length} categories, ${skillCount} skills, ${BADGES.length} badges`);
  return skillIdBySlug;
}

async function seedDemo(db: FirebaseFirestore.Firestore, auth: ReturnType<typeof getAuth>) {
  if (process.env.SEED_ALLOW_DEMO !== "yes") {
    console.error(
      "\n  --demo creates accounts with a shared, known password.\n" +
        "  Set SEED_ALLOW_DEMO=yes to confirm this is not a production project.\n",
    );
    process.exit(1);
  }

  const now = Date.now();
  const uidByUsername = new Map<string, string>();

  for (const student of DEMO_STUDENTS) {
    const email = `${student.username}@demo.skillswap.test`;

    let uid: string;
    try {
      uid = (await auth.getUserByEmail(email)).uid;
    } catch {
      uid = (
        await auth.createUser({
          email,
          password: DEMO_PASSWORD,
          displayName: student.displayName,
          emailVerified: true,
        })
      ).uid;
    }
    uidByUsername.set(student.username, uid);

    const balance = WELCOME_BONUS + student.sessionsTaught * 25 - student.sessionsLearned * SESSION_COST;

    await db.collection("users").doc(uid).set(
      {
        uid,
        displayName: student.displayName,
        username: student.username,
        photoURL: null,
        bio: student.bio,
        city: student.city,
        role: "student",
        status: "active",
        ageConfirmed: true,
        guardianConsent: {
          given: true,
          guardianName: "Demo Guardian",
          guardianEmail: `guardian.${student.username}@demo.skillswap.test`,
          consentedAt: now,
          policyVersion: POLICY_VERSION,
        },
        skillsTeach: student.teach.map(([skillId, level]) => ({ skillId, level })),
        skillsLearn: student.learn.map((skillId) => ({ skillId, level: "beginner" })),
        isTeaching: student.teach.length > 0,
        availability: [
          { day: 6, start: "10:00", end: "13:00" },
          { day: 0, start: "16:00", end: "19:00" },
        ],
        coinBalance: Math.max(balance, 0),
        ratingAvg: student.ratingAvg,
        ratingCount: student.ratingCount,
        sessionsTaught: student.sessionsTaught,
        sessionsLearned: student.sessionsLearned,
        reportCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    );

    await db.collection("usernames").doc(student.username).set({ uid, createdAt: now });
  }

  // Denormalised teacher counts so browse pages don't aggregate on read.
  const counts = new Map<string, number>();
  for (const student of DEMO_STUDENTS) {
    for (const [slug] of student.teach) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  const countBatch = db.batch();
  for (const [slug, count] of counts) {
    countBatch.set(db.collection("skills").doc(slug), { teacherCount: count }, { merge: true });
  }
  await countBatch.commit();

  console.log(`  ${DEMO_STUDENTS.length} demo students (password: ${DEMO_PASSWORD})`);
  console.log(`  sign in as: ${DEMO_STUDENTS[0].username}@demo.skillswap.test`);
  return uidByUsername;
}

async function main() {
  const { db, auth } = init();

  console.log("\nSeeding Skill Swap\n");
  console.log("Catalogue:");
  await seedCatalogue(db);

  if (DEMO) {
    console.log("\nDemo data:");
    await seedDemo(db, auth);
  } else {
    console.log("\n  (run with --demo to add demo students)");
  }

  console.log("\nDone.\n");
}

main().catch((error) => {
  console.error("\nSeed failed:", error);
  process.exit(1);
});
