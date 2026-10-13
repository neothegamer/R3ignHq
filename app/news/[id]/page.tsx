import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

type Post = {
  id: string;
  title: string;
  category: string;
  body: string;
  author_name: string | null;
  created_at: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadPost(id: string): Promise<Post | null> {
  if (!UUID.test(id)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news_posts")
    .select("id, title, category, body, author_name, created_at")
    .eq("id", id)
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
  const { id } = await params;
  const post = await loadPost(id);

  if (!post) return { title: "Story not found" };

  const description = summary(post.body);
  return {
    title: post.title,
    description,
    openGraph: {
      title: `${post.title} · R3IGN HQ`,
      description,
      type: "article",
      url: `/news/${post.id}`,
      images: ["/assets/r3ign-logo-256.jpg"],
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
  const { id } = await params;
  const post = await loadPost(id);

  if (!post) notFound();

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
