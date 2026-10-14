import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://r3igngaming.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or signed-in-only areas. The admin area is never listed.
      disallow: ["/admin", "/account", "/messages", "/onboarding"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
