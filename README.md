# Skill Swap

A peer-to-peer skill exchange for school students. You list what you can teach
and what you want to learn; the platform pairs you with someone whose lists are
the mirror of yours. Teaching earns SkillCoins, learning spends them, and every
session runs on video inside the platform.

Built for Hackathon 2026.

**Live: [skill-swap-2026.netlify.app](https://skill-swap-2026.netlify.app)** — a real
deployment with a real database, not a mockup.

---

## If you are here to evaluate it

Four files carry most of the thinking, if you only want to read a few:

| File | Why it matters |
| --- | --- |
| `lib/matching/score.ts` | The product's one opinion, in code: a two-way swap outranks a one-way match no matter what the ratings say. |
| `app/api/sessions/complete/route.ts` | Both people must confirm, and most of the booked time must have passed, before coins move. Our own worst bug was here — one person could complete a 30-minute session after a minute and take the reward. |
| `firestore.rules` | Deny-by-default. A student cannot write their own coin balance, rating or role, even on their own document. |
| `lib/ai/fallback-chain.ts` | Three AI providers tried in order, because free tiers rate-limit and a one-provider chatbot dies mid-demo. |

---

## Getting it running

You need Node 20.9 or newer. Nothing in this stack requires a payment method.

### 1. Install

```bash
npm install
```

### 2. Create a Firebase project

At [console.firebase.google.com](https://console.firebase.google.com), make a
project and turn on:

- **Authentication** → Email/Password, and Google
- **Firestore Database**

Stay on the free **Spark** plan. This project uses neither Cloud Functions nor
Firebase Storage — both now require the paid Blaze plan — so you never need to
add a card. Avatars fall back to initials, or to the photo already on a Google
account.

Once deployed, add your domain under **Authentication → Settings → Authorized
domains**, or Google sign-in will fail with `auth/unauthorized-domain`.

### 3. Fill in your environment

```bash
cp .env.local.example .env.local
```

- The `NEXT_PUBLIC_FIREBASE_*` values come from **Project settings → General →
  Your apps → Web app**.
- The `FIREBASE_ADMIN_*` values come from **Project settings → Service accounts
  → Generate new private key**. Paste the private key on one line with the `\n`
  escapes intact, wrapped in double quotes.
- At least one AI key for SkillBot. All three have free tiers:
  [Gemini](https://aistudio.google.com/apikey),
  [Groq](https://console.groq.com/keys),
  [Mistral](https://console.mistral.ai/api-keys).

### 4. Load the skill catalogue

```bash
npm run seed
```

To also create fourteen sign-innable demo students so the app looks alive:

```bash
SEED_ALLOW_DEMO=yes npm run seed:demo
```

They share one password, so never run this against a real project. Sign in as
`aarav_s@demo.skillswap.test` with the password printed by the script.

### 5. Publish the security rules

```bash
npm run rules:deploy
```

**Do not skip this.** Until the rules are deployed, Firestore uses its default
policy, which is either open or closed — neither is what this app expects.

### 6. Start

```bash
npm run dev
```

---

## Scripts

| Command              | What it does                                        |
| -------------------- | --------------------------------------------------- |
| `npm run dev`        | Dev server on port 3000                             |
| `npm run build`      | Production build                                    |
| `npm run typecheck`  | TypeScript, no emit                                 |
| `npm run lint`       | ESLint                                              |
| `npm run seed`       | Skill catalogue and badges only — safe in prod      |
| `npm run seed:demo`  | Catalogue plus demo students — development only     |
| `npm run rules:deploy` | Push `firestore.rules` and the indexes            |
| `npm run emulators`  | Firebase emulator suite                             |

---

## How it is put together

**Next.js 16 (App Router) on Netlify + Firebase on the free tier.** There are no
Cloud Functions: everything a Cloud Function would have done runs in a Next.js
Route Handler using `firebase-admin`, which deploys as a Netlify Function.

### Where the trust boundary sits

The client SDK is allowed to do exactly three things: read the public
catalogue, maintain its own profile, and carry a live chat. Everything that
carries value or consequence goes through `app/api/**`, which holds the Admin
credentials.

`firestore.rules` denies client writes to `coinBalance`, `ratingAvg`,
`ratingCount`, `status`, `role` and `reportCount` — on your own document too.
So there is no client path to those fields at all, rather than a
hard-to-reach one.

Sessions are held in an **httpOnly cookie**, not a token in JavaScript's reach.
`proxy.ts` (Next 16's renamed middleware) only checks whether a cookie is
*present* — the real check is `requireUser` / `requireAdmin` in the layouts and
route handlers, which is where a forged or revoked cookie is rejected.

### Things worth knowing before you change them

- **`lib/coins/ledger.ts`** — every coin movement writes a balance and an
  immutable ledger row in the same transaction. Balances are never written
  anywhere else.
- **`app/api/sessions/complete/route.ts`** — both people have to confirm before
  any coins move, and most of the booked time must have elapsed first. Without
  those two rules the fastest way to earn was to book a friend, join, and leave
  after a minute. `settledAt` is checked and set inside the same transaction, so
  a double tap or a retry cannot pay a teacher twice.
- **`lib/matching/score.ts`** — pure and dependency-free. A two-way swap always
  outranks a one-way match, whatever the raw score says.
- **`lib/ai/fallback-chain.ts`** — tries Gemini, then Groq, then Mistral, with
  an 8-second timeout each. A provider with no key is skipped without an
  attempt, so the app runs on one, two, or three keys. Change the order with
  `AI_PROVIDER_ORDER`; add a provider by writing one file.

### Safety, which is a feature here and not a footnote

The users are minors, so these are structural rather than cosmetic:

- **Video only.** `sessions.mode` is hardcoded and the rules reject any other
  value. There is no in-person meeting feature to misuse.
- **Guardian consent before contact.** An account cannot exist without a
  consent record — both are written in the same transaction at signup. Booking
  and chat are gated on it in the UI *and* in the rules.
- **`consentRecords` is append-only** and unreadable by any client. It is the
  record that actually evidences consent; the copy on the user document is a
  convenience.
- **Report and block from anywhere.** Report priority is assigned server-side,
  so nobody can file fake "high priority" reports to bury real ones. Blocking
  writes straight to Firestore, so it still works when a server route is down.
- **Every admin action is logged** to `adminActions` with who, what and why.

### Where this stands against the DPDP Act, 2023

India's Digital Personal Data Protection Act asks for a guardian's consent for
users under 18, forbids behavioural tracking and targeted advertising aimed at
children, and expects data minimisation. Against that:

- **Consent is recorded** — guardian name, email, timestamp and policy version,
  in an append-only collection, and it gates booking and messaging in both the
  UI and the rules.
- **No tracking, no ads** — there is not one analytics, advertising or tracking
  script in this repository. Nothing profiles a student's behaviour.
- **Data minimisation** — display name, username, short bio, city. No phone
  number, no address, no school name, no date of birth.

**The gap, stated plainly:** the Act asks for consent that is *verifiable*. Ours
is declarative — the guardian's details are recorded, but no confirmation email
is sent to them. That is the first thing to add before any real public launch,
and `consentRecords` is a separate collection specifically so it drops in
without touching anything else.

---

## Deploying to Netlify

1. Push to GitHub.
2. Connect the repo on Netlify. `netlify.toml` already sets the build command
   and the Next.js runtime plugin.
3. Add every variable from `.env.local` under **Site settings → Environment
   variables**, and set `NEXT_PUBLIC_SITE_URL` to the real domain.
4. Deploy, then run `npm run rules:deploy` against the production Firebase
   project.

---

## Before a real public launch

The build is production-quality, but launching to the open internet for minors
is a decision beyond the code:

- Move video off the public `meet.jit.si` to self-hosted Jitsi or JaaS with
  authentication, so a leaked room link cannot be joined by a stranger.
- Soft-launch inside one school with a teacher watching the moderation queue
  before opening signups more widely.
- Have someone verify the privacy policy against your actual data handling —
  the text describes what this code does, but a real launch deserves review.
