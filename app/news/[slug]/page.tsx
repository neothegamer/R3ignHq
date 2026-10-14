import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ slug: string }>;
};

type Post = {
  id: string;
  slug: string;
  title: string;
  category: string;
  body: string;
  author_name: string | null;
  created_at: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLUMNS = "id, slug, title, category, body, author_name, created_at";

/**
 * Loads a published story by slug. An old link that uses the story's id still
 * works: it is looked up by id and the visitor is redirected to the slug URL.
 *
 * `slug` is not in the generated database types yet, so the client is widened
 * for these queries.
 */
async function loadPost(param: string): Promise<Post | null> {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const column = UUID.test(param) ? "id" : "slug";

  const { data, error } = await supabase
    .from("news_posts")
    .select(COLUMNS)
    .eq(column, param)
    .eq("published", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as Post;
}

function summary(body: string) {
  const text = body.replace(/\s+/g, " ").trim();
  return text.length > 160 ? text.slice(0, 157).trim() + "…" : text;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);

  if (!post) return { title: "Story not found" };

  const description = summary(post.body);
  const url = `/news/${post.slug}`;
  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${post.title} · R3IGN HQ`,
      description,
      type: "article",
      url,
      siteName: "R3IGN HQ",
      publishedTime: post.created_at,
      authors: post.author_name ? [post.author_name] : undefined,
      images: [
        {
          url: "/assets/r3ign-logo-256.jpg",
          width: 256,
          height: 256,
          alt: "R3IGN HQ",
        },
      ],
    },
    twitter: {
      card: "summary",
      title: `${post.title} · R3IGN HQ`,
      description,
      images: ["/assets/r3ign-logo-256.jpg"],
    },
  };
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await loadPost(slug);

  if (!post) notFound();

  // Old id-based link: send it to the permanent slug address.
  if (UUID.test(slug) && post.slug) permanentRedirect(`/news/${post.slug}`);

  const paragraphs = post.body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main id="main-content">
      <div className="page-header">
        <div className="wrap">
          <span className="breadcrumb">
            <Link href="/">Home</Link> / <Link href="/news">News</Link> /{" "}
            {post.category}
          </span>
          <span
            className="eyebrow"
            style={{ marginTop: "1rem", display: "inline-flex" }}
          >
            {post.category}
          </span>
          <h1>{post.title}</h1>
          <p>
            {fmtDate(post.created_at)}
            {post.author_name ? ` · ${post.author_name}` : ""}
          </p>
        </div>
      </div>

      <section>
        <div className="wrap" style={{ maxWidth: "70ch" }}>
          {paragraphs.map((p, i) => (
            <p key={i} style={{ marginBottom: "1.25rem", lineHeight: 1.7 }}>
              {p}
            </p>
          ))}
          <p style={{ marginTop: "2rem" }}>
            <Link href="/news" className="btn btn-ghost">
              ← Back to News
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
