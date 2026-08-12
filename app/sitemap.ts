import { getCategories, getTeachingUsers } from "@/lib/queries";
import { siteUrl } from "@/lib/seo/structured-data";
import type { MetadataRoute } from "next";

export const revalidate = 3600;

/**
 * Only genuinely public pages are listed. The signed-in area is excluded here
 * and disallowed in robots.ts — a sitemap entry for a page that redirects to
 * login is a crawl-budget leak, not an SEO win.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, teachers] = await Promise.all([getCategories(), getTeachingUsers()]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: siteUrl("/privacy"), changeFrequency: "yearly", priority: 0.3 },
    { url: siteUrl("/terms"), changeFrequency: "yearly", priority: 0.3 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: siteUrl(`/skills/${category.slug}`),
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const profilePages: MetadataRoute.Sitemap = teachers.map((user) => ({
    url: siteUrl(`/u/${user.username}`),
    lastModified: new Date(user.updatedAt),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...profilePages];
}
