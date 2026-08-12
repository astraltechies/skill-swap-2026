import type { PublicUserProfile, Skill, SkillCategory } from "@/types/firestore";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function siteUrl(path = ""): string {
  return `${SITE_URL}${path}`;
}

/**
 * JSON-LD is emitted as a plain <script> rather than through a helper library.
 * Values are interpolated by JSON.stringify, which escapes the characters that
 * would otherwise let profile text break out of the script tag.
 */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Skill Swap",
    url: siteUrl(),
    description:
      "A student-to-student skill exchange where learners teach what they know and learn what they don't.",
  };
}

export function categorySchema(category: SkillCategory, skills: Skill[], teacherCount: number) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Learn ${category.name} from other students`,
    description: category.description,
    url: siteUrl(`/skills/${category.slug}`),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: skills.length,
      itemListElement: skills.map((skill, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Course",
          name: skill.name,
          description: skill.description,
          provider: {
            "@type": "Organization",
            name: "Skill Swap",
            url: siteUrl(),
          },
          // Free in money terms — the exchange is in SkillCoins, which cannot
          // be purchased, so declaring a zero price is accurate.
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "INR",
            availability:
              teacherCount > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },
        },
      })),
    },
  };
}

export function personSchema(user: PublicUserProfile, skillNames: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: user.displayName,
    url: siteUrl(`/u/${user.username}`),
    description: user.bio || `${user.displayName} teaches ${skillNames.join(", ")} on Skill Swap.`,
    knowsAbout: skillNames,
    ...(user.city ? { homeLocation: { "@type": "Place", name: user.city } } : {}),
    ...(user.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: user.ratingAvg.toFixed(1),
            reviewCount: user.ratingCount,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: siteUrl(crumb.path),
    })),
  };
}
