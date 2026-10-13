"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SiteSearch from "@/components/SiteSearch";

export type NewsPost = {
  id: string;
  title: string;
  category: string;
  body: string;
  created_at: string;
};

const CATEGORY_TAG: Record<string, string> = {
  "League Update": "update",
  "Match Recap": "recap",
  Announcement: "announcement",
  Community: "community",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function excerpt(body: string) {
  const text = body.replace(/\s+/g, " ").trim();
  return text.length > 140 ? text.slice(0, 140).trim() + "…" : text;
}

type Props = {
  posts?: NewsPost[];
};

export default function NewsGrid({ posts = [] }: Props) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const source = posts;

  const visible = useMemo(
    () =>
      source.filter((post) => {
        const matchesCategory =
          filter === "all" || CATEGORY_TAG[post.category] === filter;
        const searchable =
          `${post.title} ${post.category} ${post.body}`.toLowerCase();
        return (
          matchesCategory && searchable.includes(query.trim().toLowerCase())
        );
      }),
    [source, filter, query]
  );

  return (
    <>
      <SiteSearch
        value={query}
        onChange={setQuery}
        placeholder="Search news…"
      />
      <div className="filter-bar">
        <button
          className="filter-chip"
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className="filter-chip"
          aria-pressed={filter === "update"}
          onClick={() => setFilter("update")}
        >
          League Update
        </button>
        <button
          className="filter-chip"
          aria-pressed={filter === "recap"}
          onClick={() => setFilter("recap")}
        >
          Match Recap
        </button>
        <button
          className="filter-chip"
          aria-pressed={filter === "announcement"}
          onClick={() => setFilter("announcement")}
        >
          Announcement
        </button>
        <button
          className="filter-chip"
          aria-pressed={filter === "community"}
          onClick={() => setFilter("community")}
        >
          Community
        </button>
      </div>

      {source.length === 0 ? (
        <p className="empty-state">
          No stories yet. League updates and match recaps will appear here.
        </p>
      ) : visible.length === 0 ? (
        <p className="empty-state">No stories match that filter.</p>
      ) : null}

      <div className="news-grid">
        {visible.map((post) => (
          <Link
            key={post.id}
            href={`/news/${post.id}`}
            className="news-card news-item"
          >
            <div className="news-thumb">
              <span className="eyebrow">{post.category}</span>
            </div>
            <div className="news-body">
              <span className="eyebrow">News</span>
              <h3>{post.title}</h3>
              <p>{excerpt(post.body)}</p>
              <div className="news-foot">
                <span>{fmtDate(post.created_at)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
