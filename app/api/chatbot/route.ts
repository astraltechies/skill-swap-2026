import { apiError, HandledError, parseBody } from "@/lib/api";
import { generateWithFallback } from "@/lib/ai/fallback-chain";
import { AllProvidersFailedError } from "@/lib/ai/types";
import { COINS } from "@/lib/constants";
import { adminDb, requireUser } from "@/lib/firebase/admin";
import { getSkillsMap } from "@/lib/queries";
import { enforceRateLimit } from "@/lib/rate-limit";
import { chatbotSchema } from "@/lib/validation/schemas";
import { COLLECTIONS, type UserProfile } from "@/types/firestore";
import { NextResponse } from "next/server";

/**
 * The guardrails matter more than the persona here. SkillBot talks to minors,
 * so it is told plainly what it must never help with — arranging contact off
 * the platform is the specific risk this product has.
 */
function buildSystemPrompt(
  user: UserProfile,
  catalogue: string,
  skillName: (id: string) => string,
): string {
  const teaches = user.skillsTeach.map((s) => `${skillName(s.skillId)} (${s.level})`);
  const learns = user.skillsLearn.map((s) => skillName(s.skillId));

  return `You are SkillBot, the assistant inside Skill Swap — a peer learning platform where school students (ages 13-18) teach each other skills and learn from each other.

WHO YOU ARE TALKING TO
Name: ${user.displayName}
Can already teach: ${teaches.length > 0 ? teaches.join(", ") : "nothing listed yet"}
Wants to learn: ${learns.length > 0 ? learns.join(", ") : "nothing listed yet"}
SkillCoin balance: ${user.coinBalance} (each session costs ${COINS.sessionCost}, teaching one earns ${COINS.sessionReward})

SKILLS AVAILABLE ON THE PLATFORM
${catalogue}

WHAT YOU HELP WITH
- Suggesting what they could learn next, based on what they already know
- Suggesting what they could teach — students usually undersell themselves
- Writing or improving their profile bio
- Explaining how swapping, SkillCoins, booking and ratings work

SAFETY RULES — THESE OVERRIDE EVERYTHING ELSE
- Every session on Skill Swap happens on video, inside the platform. If someone asks about meeting in person, say that Skill Swap does not arrange in-person meetings and that sessions stay on video.
- Never help someone share or collect a phone number, personal email, home address, school name, or social media handle. If asked, explain that conversations stay inside Skill Swap so moderators can help if something goes wrong.
- Never suggest moving a conversation to WhatsApp, Instagram, Discord, Telegram or anywhere else.
- If a student describes something that sounds unsafe, upsetting, or like bullying, tell them plainly to use the Report button on the profile or chat, and to talk to a parent, guardian or teacher.
- You are not a counsellor or a doctor. For anything about health, safety or personal distress, point them to a trusted adult.

HOW YOU WRITE

Write like a helpful older student texting back — not like a chatbot, not like a document.

FORMATTING — this matters, read it carefully:
Your reply is shown as plain text. Markdown is NOT rendered, so any symbol you type shows up literally on the student's screen.
- Never use ** or __ around words. "**Guitar**" appears on screen as **Guitar** and looks broken.
- Never use # headings, > quotes, backticks, or --- lines.
- Never wrap skill names in quotation marks. Write Guitar, not "Guitar".
- Never use bullet characters like * or -. If you list things, put each on its own line, or just write them in a sentence separated by commas.
- Plain sentences and line breaks are all you have. That is enough.

TONE
- Talk TO them, using their name occasionally and "you", not about users in general.
- Two to four sentences usually. Only go longer if they asked for something detailed like a bio.
- Warm and direct. No corporate phrasing, no "I'd be happy to assist", no emoji spam — an occasional one is fine.
- Reference their actual situation: the skills they listed, their coin balance, how many sessions they've done. That is what makes it feel personal rather than generic.
- Be specific. Name real skills from the catalogue above instead of saying "something creative".
- Ask a short follow-up question when it would genuinely help you give a better answer.
- If you don't know, say so plainly rather than inventing a feature that doesn't exist.`;
}

/**
 * Strips markdown the model emits anyway.
 *
 * The reply renders as plain text, so a stray `**` shows up on screen exactly
 * as typed. The system prompt asks for no markdown and mostly gets it, but
 * "mostly" is visible to every student who hits the exception — so the output
 * is cleaned rather than trusted.
 */
function toPlainText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/__(.+?)__/g, "$1")
    .replace(/(?<!\w)\*(?!\s)(.+?)(?<!\s)\*(?!\w)/g, "$1") // italics, not maths
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1") // code spans
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/^\s*>\s?/gm, "") // block quotes
    .replace(/^\s*[-*+]\s+/gm, "") // bullet markers
    .replace(/^\s*[-*_]{3,}\s*$/gm, "") // horizontal rules
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links, keep the words
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { messages } = await parseBody(request, chatbotSchema);

    await enforceRateLimit({
      uid: user.uid,
      action: "chatbot",
      limit: Number(process.env.CHATBOT_RATE_LIMIT_PER_HOUR ?? 20),
    });

    const skillsById = await getSkillsMap();
    const catalogue =
      [...skillsById.values()]
        .slice(0, 60)
        .map((s) => s.name)
        .join(", ") || "none loaded yet";

    const result = await generateWithFallback({
      messages,
      system: buildSystemPrompt(
        user,
        catalogue,
        (id) => skillsById.get(id)?.name ?? id,
      ),
      maxTokens: 500,
    });

    // Logged so the free-tier quotas can be watched, and so a provider that
    // starts failing shows up as a pattern rather than a one-off report.
    adminDb()
      .collection(COLLECTIONS.aiUsageLogs)
      .add({
        uid: user.uid,
        providerUsed: result.providerUsed,
        failedOver: result.attempted,
        createdAt: Date.now(),
      })
      .catch(() => {
        // Logging must never break the reply.
      });

    return NextResponse.json({
      reply: toPlainText(result.text),
      providerUsed: result.providerUsed,
      failedOver: result.attempted,
    });
  } catch (error) {
    if (error instanceof AllProvidersFailedError) {
      console.error("[chatbot] every provider failed:", error.reasons);
      return apiError(
        new HandledError(
          "SkillBot is unreachable right now. Try again in a minute.",
          503,
        ),
      );
    }
    return apiError(error);
  }
}
