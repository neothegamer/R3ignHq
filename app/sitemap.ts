import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://r3igngaming.vercel.app";

  const routes = [
    "",
    "/about",
    "/awards",
    "/brackets",
    "/community",
    "/copyright",
    "/divisions",
    "/events",
    "/guide",
    "/leagues",
    "/match-highlights",
    "/media",
    "/merch",
    "/news",
    "/organizations",
    "/partnerships",
    "/privacy",
    "/rankings",
    "/register",
    "/support",
    "/terms",
  ];

  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));
}