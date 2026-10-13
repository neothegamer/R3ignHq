import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Tournament Bracket",
  description: "Live playoff bracket for R3IGN HQ tournaments.",
  openGraph: {
    title: "Tournament Bracket · R3IGN HQ",
    description: "Live playoff bracket for R3IGN HQ tournaments.",
    type: "website",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
  twitter: {
    card: "summary",
    title: "Tournament Bracket · R3IGN HQ",
    description: "Live playoff bracket for R3IGN HQ tournaments.",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
};

type Match = {
  round_number: number;
  round_name: string;
  match_order: number;
  team_a: string | null;
  team_b: string | null;
  score_a: number | null;
  score_b: number | null;
  winner: "a" | "b" | null;
};

function TeamRow({
  name,
  score,
  isWinner,
  hasResult,
}: {
  name: string | null;
  score: number | null;
  isWinner: boolean;
  hasResult: boolean;
}) {
  return (
    <div className={`bracket-team${isWinner ? " is-winner" : ""}`}>
      <span>{name ? name : <span className="bracket-tbd">TBD</span>}</span>
      {hasResult && (
        <span className="bracket-score">
          {score === null || score === undefined ? "—" : score}
        </span>
      )}
    </div>
  );
}

function MatchCard({ m }: { m: Match }) {
  const hasResult = m.score_a !== null && m.score_a !== undefined;
  return (
    <div className="bracket-match">
      <TeamRow
        name={m.team_a}
        score={m.score_a}
        isWinner={m.winner === "a"}
        hasResult={hasResult}
      />
      <TeamRow
        name={m.team_b}
        score={m.score_b}
        isWinner={m.winner === "b"}
        hasResult={hasResult}
      />
    </div>
  );
}

function Bracket({ matches }: { matches: Match[] }) {
  const rounds: Record<number, { name: string; matches: Match[] }> = {};

  matches.forEach((m) => {
    if (!rounds[m.round_number]) {
      rounds[m.round_number] = { name: m.round_name, matches: [] };
    }
    rounds[m.round_number].matches.push(m);
  });

  const roundNumbers = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b);
  const maxRound = roundNumbers[roundNumbers.length - 1];

  return (
    <div className="bracket" id="bracket-root">
      {roundNumbers.map((rn) => {
        const r = rounds[rn];
        r.matches.sort((a, b) => a.match_order - b.match_order);
        const isFinal = rn === maxRound;

        const pairs: Match[][] = [];
        for (let i = 0; i < r.matches.length; i += 2) {
          pairs.push(r.matches.slice(i, i + 2));
        }

        return (
          <div
            key={rn}
            className={`bracket-round${isFinal ? " bracket-final" : ""}`}
          >
            <div className="bracket-round-label">
              {r.name || `Round ${rn}`}
            </div>
            <div className="bracket-round-body">
              {pairs.map((pair, pi) => (
                <div
                  key={pi}
                  className={`bracket-pair${pair.length === 1 ? " is-single" : ""}`}
                >
                  {pair.map((m, mi) => (
                    <MatchCard key={mi} m={m} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type TournamentView = {
  name: string;
  matches: Match[];
};

async function loadActiveTournament(): Promise<TournamentView | null> {
  const supabase = await createClient();

  const { data: tournament, error } = await supabase
    .from("tournaments")
    .select("id, name, status")
    .neq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !tournament) return null;

  const { data: rows, error: matchError } = await supabase
    .from("bracket_matches")
    .select(
      "round_number, round_name, match_order, team_a, team_b, score_a, score_b, winner"
    )
    .eq("tournament_id", tournament.id);

  if (matchError || !rows || rows.length === 0) return null;

  const matches: Match[] = rows.map((r) => ({
    round_number: r.round_number,
    round_name: r.round_name ?? "",
    match_order: r.match_order,
    team_a: r.team_a,
    team_b: r.team_b,
    score_a: r.score_a,
    score_b: r.score_b,
    winner: r.winner === "a" || r.winner === "b" ? r.winner : null,
  }));

  return { name: tournament.name, matches };
}

export default async function BracketsPage() {
  const tournament = await loadActiveTournament();

  return (
    <main id="main-content">
      <div className="page-header">
        <div className="wrap">
          <span className="breadcrumb">
            <Link href="/">Home</Link> /{" "}
            <Link href="/events">Events</Link> / Bracket
          </span>
          <span
            className="eyebrow"
            style={{ marginTop: "1rem", display: "inline-flex" }}
          >
            {tournament ? "Live Tournament" : "Tournament Bracket"}
          </span>
          <h1 id="bracket-title">
            {tournament ? tournament.name : "Tournament Bracket"}
          </h1>
          <p>
            Single-elimination playoff bracket. Winners advance right; the
            final sits on the far right.
          </p>
        </div>
      </div>

      <section>
        <div className="wrap">
          {tournament ? (
            <div className="bracket-scroll">
              <Bracket matches={tournament.matches} />
            </div>
          ) : (
            <div className="empty-state">
              No active tournament right now. The playoff bracket appears here
              as soon as a tournament starts.{" "}
              <Link href="/leagues" style={{ color: "var(--paper)" }}>
                Explore the leagues
              </Link>
              .
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
