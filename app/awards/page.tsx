import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Awards",
  description:
    "R3IGN HQ's annual awards and Hall of Champions, recognizing top players and organizations each season.",
  openGraph: {
    title: "Awards · R3IGN HQ",
    description:
      "R3IGN HQ's annual awards and Hall of Champions, recognizing top players and organizations each season.",
    type: "website",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
  twitter: {
    card: "summary",
    title: "Awards · R3IGN HQ",
    description:
      "R3IGN HQ's annual awards and Hall of Champions, recognizing top players and organizations each season.",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
};

type Winner = {
  id: string;
  award_label: string;
  player_name: string;
  context: string | null;
  season: string | null;
};

const AWARDS = [
  { medal: "PO", label: "Player of the Year" },
  { medal: "OO", label: "Organization of the Year" },
  { medal: "RO", label: "Rookie of the Year" },
  { medal: "MO", label: "MVP of the Year" },
  { medal: "CL", label: "Community Leader" },
  { medal: "CC", label: "Content Creator of the Year" },
] as const;

const same = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

async function loadWinners(): Promise<Winner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("award_winners")
    .select("id, award_label, player_name, context, season")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Winner[];
}

export default async function AwardsPage() {
  const winners = await loadWinners();

  return (
    <main id="main-content">
      <div className="page-header">
        <div className="wrap">
          <span className="breadcrumb">
            <Link href="/">Home</Link> / Awards
          </span>
          <span
            className="eyebrow"
            style={{ marginTop: "1rem", display: "inline-flex" }}
          >
            Annual Recognition
          </span>
          <h1>R3IGN HQ Awards</h1>
          <p>
            Recognizing the players, organizations, and community members
            shaping R3IGN HQ each season.
          </p>
        </div>
      </div>

      <section className="section-tight">
        <div className="wrap">
          <div className="award-grid">
            {AWARDS.map((award) => {
              // Winners are newest first, so the first match is the latest.
              const winner = winners.find((w) =>
                same(w.award_label, award.label)
              );
              return (
                <div className="award-card" key={award.label}>
                  <div className="medal">{award.medal}</div>
                  <h3>{award.label}</h3>
                  <p>
                    {winner
                      ? `${winner.player_name}${winner.season ? ` · ${winner.season}` : ""}`
                      : "Winner to be announced"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">Hall of Champions</span>
              <h2>Recent winners</h2>
            </div>
          </div>
          {winners.length === 0 ? (
            <div className="empty-state">
              No winners have been announced yet. Check back once the season
              wraps up.
            </div>
          ) : (
            <div className="champ-grid" id="champ-grid">
              {winners.map((w) => (
                <div key={w.id} className="champ-card">
                  <div className="tag">{w.award_label}</div>
                  <h3>{w.player_name}</h3>
                  {w.context ? <p>{w.context}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
