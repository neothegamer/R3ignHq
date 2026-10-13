import Link from "next/link";
import { getConfirmedResults, getRankings } from "@/lib/teams";
import { getLeagueSeasons } from "@/lib/season";
import RankingsTable from "./RankingsTable";

export const metadata = {
  title: "Rankings",
  description:
    "Live R3IGN HQ league standings, win-loss records, and win percentage across RCML, RFCL, and RBSL.",
  openGraph: {
    title: "Rankings · R3IGN HQ",
    description:
      "Live R3IGN HQ league standings, win-loss records, and win percentage across RCML, RFCL, and RBSL.",
    type: "website",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
  twitter: {
    card: "summary",
    title: "Rankings · R3IGN HQ",
    description:
      "Live R3IGN HQ league standings, win-loss records, and win percentage across RCML, RFCL, and RBSL.",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
};

export default async function RankingsPage() {
  const [rows, results, leagueSeasons] = await Promise.all([
    getRankings(),
    getConfirmedResults(),
    getLeagueSeasons(),
  ]);

  const seasons: Record<string, string | null> = {};
  for (const s of leagueSeasons) seasons[s.league.toLowerCase()] = s.seasonName;

  return (
    <main id="main-content">
      <div className="page-header">
        <div className="wrap">
          <span className="breadcrumb">
            <Link href="/">Home</Link> / Rankings
          </span>
          <span
            className="eyebrow"
            style={{ marginTop: "1rem", display: "inline-flex" }}
          >
            Live Standings
          </span>
          <h1>Rankings</h1>
          <p>
            Standings update after every reported match. Teams are ordered by
            points, then win percentage; ties are broken by head-to-head
            result, then points differential, then total wins.
          </p>
        </div>
      </div>

      <section>
        <div className="wrap">
          <RankingsTable rows={rows} results={results} seasons={seasons} />
        </div>
      </section>
    </main>
  );
}
