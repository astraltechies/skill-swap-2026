import { siteUrl } from "@/lib/seo/structured-data";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The whole signed-in surface. These either redirect to login or carry
        // another student's private data, so there is nothing to gain by
        // crawling them and something to lose by trying.
        disallow: [
          "/api/",
          "/admin",
          "/dashboard",
          "/profile",
          "/browse",
          "/matches",
          "/sessions",
          "/chat",
          "/wallet",
          "/skillbot",
          "/leaderboard",
          "/login",
          "/signup",
        ],
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
  };
}
