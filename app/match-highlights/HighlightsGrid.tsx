"use client";

import { useState } from "react";

export type Highlight = {
  title: string;
  description: string;
  league: string;
  match_label: string;
  video_url: string;
  created_at: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function ShareButton({ h }: { h: Highlight }) {
  const [label, setLabel] = useState("Share");

  async function handleShare() {
    const shareData = {
      title: h.title || "R3IGN Match Highlight",
      text: h.description || "Check out this match highlight on R3IGN.",
      url: h.video_url || (typeof window !== "undefined" ? window.location.href : ""),
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // cancelled or failed — fall through to clipboard
      }
    }

    const url = shareData.url || window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setLabel("Link copied");
      setTimeout(() => setLabel("Share"), 1800);
    } catch {
      setLabel("Share");
    }
  }

  return (
    <button
      type="button"
      className="btn btn-ghost share-btn"
      style={{ padding: "0.3em 0.6em", fontSize: "0.7rem" }}
      title="Share this highlight"
      onClick={handleShare}
    >
      {label}
    </button>
  );
}

type Props = {
  items?: Highlight[];
};

export default function HighlightsGrid({ items = [] }: Props) {
  const [filter, setFilter] = useState("all");

  // Only clips that actually have a video are shown.
  const source = items.filter((h) => Boolean(h.video_url?.trim()));
  const leagueOf = (h: Highlight) => (h.league ?? "").trim().toLowerCase();
  const visible =
    filter === "all" ? source : source.filter((h) => leagueOf(h) === filter);

  // Filter chips only for leagues that actually have a clip.
  const leagues = (["rcml", "rfcl", "rbsl"] as const).filter((v) =>
    source.some((h) => leagueOf(h) === v)
  );

  return (
    <>
      {leagues.length > 0 ? (
        <div className="filter-bar">
          {(["all", ...leagues] as string[]).map((v) => (
            <button
              key={v}
              className="filter-chip"
              aria-pressed={filter === v}
              onClick={() => setFilter(v)}
            >
              {v === "all" ? "All" : v.toUpperCase()}
            </button>
          ))}
        </div>
      ) : null}

      <div className="news-grid" id="highlights-grid">
        {visible.length === 0 ? (
          <p
            className="field-hint center empty-state"
            style={{ marginTop: "1.5rem" }}
          >
            No highlights yet. Clips will appear here after the next match.
          </p>
        ) : (
          <>
            {visible.map((h, i) => (
              <div
                key={i}
                className="news-card highlight-card"
                data-tags={h.league}
              >
                <div className="news-thumb">
                  <video
                    src={h.video_url}
                    controls
                    preload="metadata"
                    playsInline
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div className="news-body">
                  {h.match_label ? (
                    <span className="eyebrow">{h.match_label}</span>
                  ) : null}
                  <h3>{h.title}</h3>
                  {h.description ? <p>{h.description}</p> : null}
                  <div className="news-foot">
                    <span>{h.created_at ? formatDate(h.created_at) : ""}</span>
                    <ShareButton h={h} />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}