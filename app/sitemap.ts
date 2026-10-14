import type { MetadataRoute } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { FEATURES } from "@/lib/features";

/** Published news stories, so each one can be found and shared. */
async function newsEntries(base: string): Promise<MetadataRoute.Sitemap> {
  try {
    // `slug` is not in the generated database types yet, so the client is
    // widened for this query.
    const supabase = (await createClient()) as unknown as SupabaseClient;
    const { data, error } = await supabase
      .from("news_posts")
      .select("slug, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return (data as { slug: string | null; created_at: string }[])
      .filter((post) => Boolean(post.slug))
      .map((post) => ({
        url: `${base}/news/${post.slug}`,
        lastModified: new Date(post.created_at),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://r3igngaming.vercel.app";

  // The admin area and signed-in pages are deliberately not listed.
  const routes = [
    "",
    "/about",
    "/awards",
    "/community",
    "/copyright",
    "/divisions",
    "/guide",
    "/leagues",
    "/media",
    "/news",
    "/organizations",
    "/partnerships",
    "/privacy",
    "/rankings",
    "/register",
    "/support",
    "/terms",
    ...(FEATURES.brackets ? ["/brackets"] : []),
    ...(FEATURES.events ? ["/events"] : []),
    ...(FEATURES.highlights ? ["/match-highlights"] : []),
    ...(FEATURES.merch ? ["/merch"] : []),
  ];

  const pages = routes.map((route) => ({
    url: `${base}${route}`,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  return [...pages, ...(await newsEntries(base))];
}
