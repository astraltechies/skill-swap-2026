import { Prose } from "@/components/legal/prose";
import { POLICY_VERSION } from "@/lib/constants";
import { siteUrl } from "@/lib/seo/structured-data";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What Skill Swap collects, why, and the rights students and guardians have over that data.",
  alternates: { canonical: siteUrl("/privacy") },
};

export default function PrivacyPage() {
  return (
    <Prose>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Privacy policy</h1>
      <p className="text-sm text-muted">
        Version {POLICY_VERSION}. Written to be read by a student, not only by a lawyer.
      </p>

      <h2>The short version</h2>
      <p>
        Skill Swap is built for school students, so we collect as little as we can get away
        with. We do not sell data, we do not run advertising, and there are no third-party
        tracking or analytics scripts on this site.
      </p>

      <h2>Who this applies to</h2>
      <p>
        Skill Swap is used by students, most of whom are children under Indian law. We process
        children&apos;s personal data only with verifiable consent from a parent or guardian,
        as required by the <strong>Digital Personal Data Protection Act, 2023</strong>. We do
        not carry out behavioural tracking, profiling, or targeted advertising directed at
        children.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your name, username, email address, and the
          password hash held by Firebase Authentication. We never see your password.
        </li>
        <li>
          <strong>Profile details:</strong> your bio, city, the skills you teach and want to
          learn, and your availability. All of this is optional except your name and username,
          and all of it is public.
        </li>
        <li>
          <strong>Guardian consent record:</strong> your parent or guardian&apos;s name and
          email address, the date consent was given, and which version of this policy it
          applied to. This is kept as an audit record and is never used for marketing.
        </li>
        <li>
          <strong>Activity:</strong> sessions you book, ratings you give and receive, your
          SkillCoin transactions, and messages you send in chat.
        </li>
        <li>
          <strong>Reports:</strong> if you report someone, we store what you told us and who
          you reported.
        </li>
      </ul>

      <h3>What we deliberately do not collect</h3>
      <ul>
        <li>Your phone number, home address, or school name.</li>
        <li>Your precise location. City is optional and free text.</li>
        <li>Advertising identifiers, cookies for tracking, or third-party analytics.</li>
      </ul>

      <h2>Video sessions</h2>
      <p>
        Video calls run on <a href="https://meet.jit.si">Jitsi Meet</a>, a third-party service.
        Calls are not recorded by Skill Swap and we do not store any video or audio. Your use
        of the call is subject to Jitsi&apos;s own privacy terms.
      </p>

      <h2>Who can see what</h2>
      <ul>
        <li>
          <strong>Public:</strong> your name, username, city, bio, the skills you teach,
          your rating and how many sessions you have taught. Search engines can index this.
        </li>
        <li>
          <strong>Only you:</strong> your SkillCoin balance and transaction history, your
          notifications, and your blocklist.
        </li>
        <li>
          <strong>Only you and the other person:</strong> your chat messages and your session
          details.
        </li>
        <li>
          <strong>Moderators:</strong> reports, and the messages or profile a report points at.
        </li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        Your profile and activity stay while your account is open. Consent records and
        moderation records are kept even after an account is closed, because they are the
        evidence that we handled a safety matter properly. Everything else is deleted when you
        ask us to close your account.
      </p>

      <h2>Your rights</h2>
      <p>
        You, or your parent or guardian, can ask us to show you the data we hold about you,
        correct anything wrong, or delete your account. Contact the teacher or staff member
        running Skill Swap at your school and they will action it.
      </p>

      <h2>Security</h2>
      <p>
        Sessions are held in an httpOnly cookie that JavaScript on the page cannot read.
        Database rules deny access by default: your coin balance, rating and account status
        cannot be edited by anyone&apos;s browser, only by our server. Chat messages can only
        be read by the two people in the conversation.
      </p>

      <h2>Changes</h2>
      <p>
        If we change this policy in a way that matters, we will ask you and your guardian to
        agree again before you can carry on using Skill Swap.
      </p>

      <p className="mt-8 border-t border-line pt-6 text-sm">
        See also the <Link href="/terms">terms of use</Link>.
      </p>
    </Prose>
  );
}
