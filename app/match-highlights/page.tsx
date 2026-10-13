import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HighlightsGrid, { type Highlight } from "./HighlightsGrid";

export const metadata = {
  title: "Match Highlights",
  description:
    "Watch screen-recorded highlights from R3IGN HQ league matches.",
  openGraph: {
    title: "Match Highlights · R3IGN HQ",
    description:
      "Watch screen-recorded highlights from R3IGN HQ league matches.",
    type: "website",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
  twitter: {
    card: "summary",
    title: "Match Highlights · R3IGN HQ",
    description:
      "Watch screen-recorded highlights from R3IGN HQ league matches.",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
};

export default async function MatchHighlightsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("match_highlights")
    .select("title, description, league, match_label, video_url, created_at")
    .not("video_url", "is", null)
    .neq("video_url", "")
    .order("created_at", { ascending: false });

  const items: Highlight[] =
    !error && data && data.length > 0 ? (data as Highlight[]) : [];

  return (
    <main id="main-content">
      <div className="page-header">
        <div className="wrap">
          <span className="breadcrumb">
            <Link href="/">Home</Link> / Match Highlights
          </span>
          <span
            className="eyebrow"
            style={{ marginTop: "1rem", display: "inline-flex" }}
          >
            Watch The Plays
          </span>
          <h1>Match Highlights</h1>
          <p>
            Screen-recorded clips from league matches, posted after each
            session.
          </p>
        </div>
      </div>

      <section className="section-tight">
        <div className="wrap">
          <HighlightsGrid items={items} />
        </div>
      </section>
    </main>
  );
}
