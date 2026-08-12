import { PageContainer, PageHeader } from "@/components/shell/page";
import { SwapCard } from "@/components/swap/swap-card";
import { EmptyState } from "@/components/ui/card";
import { requireUser } from "@/lib/firebase/admin";
import { getBlockedIds, getCategories, getSkillsMap, getTeachingUsers } from "@/lib/queries";
import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import { BrowseFilters } from "./browse-filters";

export const metadata: Metadata = {
  title: "Browse skills",
  robots: { index: false, follow: false },
};

export default async function BrowsePage({ searchParams }: PageProps<"/browse">) {
  // Only the blocklist needs the uid, so everything else starts immediately
  // rather than queuing behind the identity check.
  const [me, skillsById, categories, everyone, params] = await Promise.all([
    requireUser(),
    getSkillsMap(),
    getCategories(),
    getTeachingUsers(),
    searchParams,
  ]);

  const blocked = await getBlockedIds(me.uid);

  const categoryId = typeof params.category === "string" ? params.category : "";
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";

  const results = everyone.filter((user) => {
    if (user.uid === me.uid || blocked.has(user.uid)) return false;

    if (categoryId) {
      const inCategory = user.skillsTeach.some(
        (s) => skillsById.get(s.skillId)?.categoryId === categoryId,
      );
      if (!inCategory) return false;
    }

    if (query) {
      const haystack = [
        user.displayName,
        user.username,
        user.city,
        ...user.skillsTeach.map((s) => skillsById.get(s.skillId)?.name ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Browse"
        subtitle={`${results.length} ${results.length === 1 ? "student" : "students"} teaching right now`}
      />

      <BrowseFilters categories={categories} activeCategory={categoryId} query={query} />

      {results.length > 0 ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((user) => (
            <SwapCard
              key={user.uid}
              user={user}
              skillsById={skillsById}
              wants={user.skillsLearn}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState
            icon={<SearchX className="size-7" aria-hidden />}
            title="Nothing here yet"
            body={
              query || categoryId
                ? "Try a different search or clear the filters."
                : "No one else is teaching yet. Be the first — add a skill to your profile."
            }
          />
        </div>
      )}
    </PageContainer>
  );
}
