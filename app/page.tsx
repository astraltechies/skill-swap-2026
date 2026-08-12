import { Logo } from "@/components/brand/logo";
import { JsonLd } from "@/components/seo/json-ld";
import { PublicHeaderActions } from "@/components/shell/public-header-actions";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { COINS } from "@/lib/constants";
import { getCategories } from "@/lib/queries";
import { organizationSchema, siteUrl } from "@/lib/seo/structured-data";
import { ArrowRight, ArrowLeftRight, Coins, Flag, ShieldCheck, Video } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Skill Swap — Teach what you know, learn what you don't",
  description:
    "A student-to-student skill exchange. Teach guitar, earn SkillCoins, spend them learning Python. Video sessions only, with guardian consent built in.",
  alternates: { canonical: siteUrl("/") },
};

const STEPS = [
  {
    title: "List both sides",
    body: "Add what you can teach and what you want to learn. Nobody is only a teacher or only a student.",
  },
  {
    title: "Get matched",
    body: "We pair you with people who want what you have — and have what you want. Two-way swaps rank first.",
  },
  {
    title: "Meet on video",
    body: `Book a session, join the call from here. Teaching earns ${COINS.sessionReward} SkillCoins; learning spends ${COINS.sessionCost}.`,
  },
];

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <>
      <JsonLd data={organizationSchema()} />

      <header className="px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Logo />
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <PublicHeaderActions />
          </div>
        </div>
      </header>

      <main>
        {/* The hero states the swap and then shows it: two cards, each holding
            what the other one wants, with the exchange running between them. */}
        <section className="px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-14">
          <div className="mx-auto max-w-5xl">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <div>
                <Pill tone="neutral" className="mb-5">
                  For students, by students
                </Pill>
                <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                  Teach what you know.
                  <br />
                  <span className="text-muted">Learn what you don&apos;t.</span>
                </h1>
                <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
                  You are already good at something. Someone in your year wants to learn it —
                  and can teach you the thing you have been putting off.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg">
                    <Link href="/signup">
                      Start swapping
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/skills/code-and-tech">See what people teach</Link>
                  </Button>
                </div>

                <p className="mt-4 flex items-center gap-1.5 text-sm text-muted">
                  <Video className="size-3.5" aria-hidden />
                  Free. Video sessions only. Guardian consent required.
                </p>
              </div>

              <div className="relative">
                <SwapDemo />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-surface px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              How it works
            </h2>
            <ol className="mt-6 grid gap-6 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  {/* Numbered because these genuinely happen in order. */}
                  <span className="tabular text-sm font-medium text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-1.5 font-display text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              What students swap
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/skills/${category.slug}`}
                    className="flex h-full items-start gap-3 rounded-2xl border border-line bg-surface p-4 pressable transition-colors duration-(--duration-fast) hover:bg-surface-sunk"
                  >
                    <span className="text-2xl" aria-hidden>
                      {category.emoji}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display font-semibold">{category.name}</span>
                      <span className="mt-0.5 block text-sm text-muted">
                        {category.description}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Safety gets its own section rather than a footer link — it is the
            first thing a parent or a teacher will look for. */}
        <section className="border-t border-line bg-surface px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Built for students, so safety is not optional
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Video,
                  title: "Video only, always",
                  body: "Skill Swap never arranges meetings in person. Every session happens on a call inside the platform.",
                },
                {
                  icon: ShieldCheck,
                  title: "Guardian consent first",
                  body: "No student can book or message anyone until a parent or guardian has signed off, and that record is kept.",
                },
                {
                  icon: Flag,
                  title: "Report from anywhere",
                  body: "Every profile and chat has a report button. Safety reports go to the top of the moderation queue.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <Card key={title}>
                  <CardBody>
                    <Icon className="mb-2.5 size-5 text-learn" aria-hidden />
                    <h3 className="font-display font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              What could you teach?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-lg text-muted">
              Most people underrate this. If you can explain it to a friend, you can teach it.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link href="/signup">
                Create your account
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
            <Link href="/login" className="hover:text-ink">
              Sign in
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}

/**
 * The signature, at hero scale: two cards holding what the other one wants.
 * Static rather than animated — the idea reads instantly, and a looping
 * animation here would compete with the headline instead of supporting it.
 */
function SwapDemo() {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-stretch gap-3 lg:max-w-none">
      <Card className="shadow-md">
        <CardBody className="py-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-teach-ink">
            Diya can teach
          </p>
          <p className="mt-1 font-display text-xl font-semibold">Guitar</p>
          <p className="mt-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-learn-ink">
            Diya wants to learn
          </p>
          <p className="mt-1 font-display text-xl font-semibold text-muted">Python</p>
        </CardBody>
      </Card>

      <div className="flex items-center justify-center gap-2 text-sm text-muted">
        <span className="h-px flex-1 bg-line-strong" />
        <ArrowLeftRight className="size-4 text-learn" aria-hidden />
        <span className="font-medium">a swap</span>
        <span className="h-px flex-1 bg-line-strong" />
      </div>

      <Card className="shadow-md">
        <CardBody className="py-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-teach-ink">
            Aarav can teach
          </p>
          <p className="mt-1 font-display text-xl font-semibold">Python</p>
          <p className="mt-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-learn-ink">
            Aarav wants to learn
          </p>
          <p className="mt-1 font-display text-xl font-semibold text-muted">Guitar</p>
        </CardBody>
      </Card>

      <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
        <Coins className="size-3.5 text-teach" aria-hidden />
        Nobody pays. Teaching earns the coins that learning spends.
      </p>
    </div>
  );
}
