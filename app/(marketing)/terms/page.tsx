import { Prose } from "@/components/legal/prose";
import { COINS, MIN_AGE, POLICY_VERSION } from "@/lib/constants";
import { siteUrl } from "@/lib/seo/structured-data";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The rules of Skill Swap: who can join, how sessions work, and what gets you removed.",
  alternates: { canonical: siteUrl("/terms") },
};

export default function TermsPage() {
  return (
    <Prose>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Terms of use</h1>
      <p className="text-sm text-muted">Version {POLICY_VERSION}.</p>

      <h2>Who can join</h2>
      <ul>
        <li>You must be {MIN_AGE} or older.</li>
        <li>
          A parent or guardian must give consent before you can book a session or message
          anyone. You can browse without it.
        </li>
        <li>One account per person. Do not pretend to be someone else.</li>
      </ul>

      <h2>How sessions work</h2>
      <ul>
        <li>
          <strong>Every session is on video, inside Skill Swap.</strong> We do not arrange, and
          you must not use Skill Swap to arrange, meeting anyone in person.
        </li>
        <li>
          Sessions are requested by a learner and accepted by a teacher. Either side can cancel
          before it starts.
        </li>
        <li>
          Coins move only when a session is marked complete: the learner spends{" "}
          {COINS.sessionCost}, the teacher earns {COINS.sessionReward}. Nothing is charged for
          a session that is declined or cancelled.
        </li>
      </ul>

      <h2>SkillCoins</h2>
      <p>
        SkillCoins are not money. They cannot be bought, sold, transferred between accounts, or
        exchanged for anything outside Skill Swap, and they have no cash value. They exist so
        that the platform stays a swap rather than becoming free labour for a few people.
      </p>
      <p>
        You start with {COINS.welcomeBonus} so you can learn something before you have taught
        anything.
      </p>

      <h2>How to behave</h2>
      <p>Keep it the way you would want a classmate to treat you. Specifically, do not:</p>
      <ul>
        <li>Bully, harass, threaten, or demean anyone.</li>
        <li>Share sexual, violent, or otherwise inappropriate content.</li>
        <li>
          Ask for or share personal contact details — phone numbers, addresses, social media
          handles — or try to move a conversation off Skill Swap. This rule exists so that
          moderators can actually help if something goes wrong.
        </li>
        <li>Ask anyone to meet you in person.</li>
        <li>Advertise, spam, or try to sell anything.</li>
        <li>Book sessions you do not intend to turn up to.</li>
        <li>Try to get around a block, a suspension, or a ban.</li>
      </ul>

      <h2>Reporting and moderation</h2>
      <p>
        Every profile and every chat has a Report button. Reports about safety or harassment go
        to the top of the moderation queue. Reported accounts may be put under review, which a
        moderator then looks at.
      </p>
      <p>
        We can suspend or remove an account that breaks these rules. Serious safety breaches
        mean removal without warning. Every moderation action is recorded with who took it and
        why.
      </p>
      <p>
        <strong>
          If something happens that makes you feel unsafe, tell a parent, guardian or teacher
          as well as reporting it here.
        </strong>{" "}
        Skill Swap moderators are not a substitute for an adult you trust.
      </p>

      <h2>What we do not promise</h2>
      <p>
        Skill Swap connects students. We do not check that anyone is actually good at what they
        say they can teach, and ratings are opinions from other students, not qualifications.
        Use your judgement, and tell us if a listing looks dishonest.
      </p>

      <h2>Closing your account</h2>
      <p>
        You or your guardian can ask for your account to be closed at any time — speak to the
        staff member running Skill Swap at your school.
      </p>

      <p className="mt-8 border-t border-line pt-6 text-sm">
        See also the <Link href="/privacy">privacy policy</Link>.
      </p>
    </Prose>
  );
}
