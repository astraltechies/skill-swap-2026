import { Logo } from "@/components/brand/logo";
import { JsonLd } from "@/components/seo/json-ld";
import { PageContainer } from "@/components/shell/page";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Pill, SkillPill } from "@/components/ui/pill";
import { getCategories, getSkills, getTeachingUsers } from "@/lib/queries";
import { breadcrumbSchema, categorySchema, siteUrl } from "@/lib/seo/structured-data";
import { ArrowRight, Star, Video } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

/**
 * Fully static with hourly revalidation. Nothing here reads the session, which
 * is exactly why it can be cached and served from the edge to a crawler.
 */
export const revalidate = 3600;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/skills/[category]">): Promise<Metadata> {
  const { category: slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return { title: "Category not found" };

  const title = `Learn ${category.name} from other students`;

  return {
    title,
    description: `${category.description} Free peer-to-peer sessions on video, taught by students who just learned it themselves.`,
    alternates: { canonical: siteUrl(`/skills/${category.slug}`) },
    openGraph: {
      title,
      description: category.description,
      url: siteUrl(`/skills/${category.slug}`),
    },
  };
}

export default async function CategoryPage({ params }: PageProps<"/skills/[category]">) {
  const { category: slug } = await params;

  const [categories, allSkills, teachers] = await Promise.all([
    getCategories(),
    getSkills(),
    getTeachingUsers(),
  ]);

  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const skills = allSkills.filter((s) => s.categoryId === category.id);
  const skillIds = new Set(skills.map((s) => s.id));
  const skillsById = new Map(allSkills.map((s) => [s.id, s]));

  const categoryTeachers = teachers
    .filter((user) => user.skillsTeach.some((s) => skillIds.has(s.skillId)))
    .sort((a, b) => b.ratingAvg * b.ratingCount - a.ratingAvg * a.ratingCount)
    .slice(0, 12);

  return (
    <>
      <JsonLd data={categorySchema(category, skills, categoryTeachers.length)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Skill Swap", path: "/" },
          { name: category.name, path: `/skills/${category.slug}` },
        ])}
      />

      <header className="border-b border-line px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Link href="/">
            <Logo />
          </Link>
          <Button asChild size="sm">
            <Link href="/signup">Join Skill Swap</Link>
          </Button>
        </div>
      </header>

      <PageContainer width="wide">
        <div className="mb-8 max-w-2xl">
          <span className="text-4xl" aria-hidden>
            {category.emoji}
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Learn {category.name} from other students
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-ink-soft">
            {category.description}
          </p>
          <p className="mt-2 text-sm text-muted">
            {categoryTeachers.length > 0
              ? `${categoryTeachers.length} ${categoryTeachers.length === 1 ? "student teaches" : "students teach"} this on Skill Swap.`
              : "No one is teaching this yet — you could be the first."}
          </p>
        </div>

        <section className="mb-10">
          <h2 className="mb-3 font-display text-lg font-semibold">What you can learn</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill) => (
              <Card key={skill.id}>
                <CardBody>
                  <h3 className="font-display text-base font-semibold">{skill.name}</h3>
                  <p className="mt-1 text-sm text-muted">{skill.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        {categoryTeachers.length > 0 ? (
          <section className="mb-10">
            <h2 className="mb-3 font-display text-lg font-semibold">Students teaching this</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categoryTeachers.map((user) => (
                <li key={user.uid}>
                  <Link
                    href={`/u/${user.username}`}
                    className="flex h-full items-start gap-3 rounded-2xl border border-line bg-surface p-4 pressable transition-colors duration-(--duration-fast) hover:bg-surface-sunk"
                  >
                    <Avatar name={user.displayName} src={user.photoURL} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{user.displayName}</p>
                      {user.ratingCount > 0 ? (
                        <p className="flex items-center gap-1 text-sm text-muted">
                          <Star className="size-3.5 fill-teach text-teach" aria-hidden />
                          <span className="tabular">{user.ratingAvg.toFixed(1)}</span>
                          <span>· {user.sessionsTaught} taught</span>
                        </p>
                      ) : (
                        <p className="text-sm text-muted">New teacher</p>
                      )}
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {user.skillsTeach
                          .filter((s) => skillIds.has(s.skillId))
                          .slice(0, 2)
                          .map((s) => (
                            <li key={s.skillId}>
                              <SkillPill
                                name={skillsById.get(s.skillId)?.name ?? s.skillId}
                                level={s.level}
                                tone="teach"
                              />
                            </li>
                          ))}
                      </ul>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Card className="border-learn/30 bg-learn-wash">
          <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Teach something, learn something
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Every session is a swap. Teach what you already know, earn SkillCoins, spend
                them learning {category.name.toLowerCase()}.
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                <Video className="size-3.5" aria-hidden />
                Video sessions only, with guardian consent for every student.
              </p>
            </div>
            <Button asChild variant="learn" size="lg" className="shrink-0">
              <Link href="/signup">
                Get started
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </CardBody>
        </Card>

        <nav className="mt-10 border-t border-line pt-6">
          <h2 className="mb-3 text-sm font-medium text-muted">Other categories</h2>
          <ul className="flex flex-wrap gap-2">
            {categories
              .filter((c) => c.id !== category.id)
              .map((c) => (
                <li key={c.id}>
                  <Link href={`/skills/${c.slug}`}>
                    <Pill tone="neutral">
                      <span aria-hidden>{c.emoji}</span> {c.name}
                    </Pill>
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </PageContainer>
    </>
  );
}
