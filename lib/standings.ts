/**
 * Standings helpers. Pure functions only (no server imports), so they can be
 * used from both server and client components.
 *
 * Ordering rules, in order:
 *   1. Points (highest first)
 *   2. Win % (highest first)
 *   3. Head-to-head wins between the teams that are still tied
 *   4. Total wins
 *   5. Team name (so the order is stable)
 */

export type LiveRanking = {
  team_name: string;
  tag: string | null;
  league: string | null;
  wins: number | null;
  losses: number | null;
  points: number | null;
};

export type MatchResult = {
  league: string | null;
  team_a: string | null;
  team_b: string | null;
  score_a: number | null;
  score_b: number | null;
};

export type StandingRow = {
  pos: number;
  team: string;
  tag: string;
  wins: number;
  losses: number;
  pct: string;
  /** True when this team was tied on points and win % with another team. */
  tied: boolean;
};

function norm(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function winRate(wins: number, losses: number) {
  const games = wins + losses;
  return games > 0 ? wins / games : 0;
}

export function formatPct(rate: number) {
  return (rate * 100).toFixed(1) + "%";
}

type Scored = {
  team: string;
  tag: string;
  wins: number;
  losses: number;
  points: number;
  rate: number;
};

/** Head-to-head wins for each team, counting only games inside the tied group. */
function headToHeadWins(group: Scored[], results: MatchResult[]) {
  const names = new Set(group.map((g) => norm(g.team)));
  const wins = new Map<string, number>();
  for (const g of group) wins.set(norm(g.team), 0);

  for (const r of results) {
    const a = norm(r.team_a);
    const b = norm(r.team_b);
    if (!names.has(a) || !names.has(b) || a === b) continue;
    if (r.score_a == null || r.score_b == null) continue;
    if (r.score_a > r.score_b) wins.set(a, (wins.get(a) ?? 0) + 1);
    else if (r.score_b > r.score_a) wins.set(b, (wins.get(b) ?? 0) + 1);
  }
  return wins;
}

export function buildStandings(
  rows: LiveRanking[],
  league: string,
  results: MatchResult[] = []
): StandingRow[] {
  const leagueKey = norm(league);

  const scored: Scored[] = rows
    .filter((r) => norm(r.league) === leagueKey)
    .map((r) => {
      const wins = Number(r.wins ?? 0);
      const losses = Number(r.losses ?? 0);
      return {
        team: r.team_name,
        tag: r.tag ?? "",
        wins,
        losses,
        points: Number(r.points ?? 0),
        rate: winRate(wins, losses),
      };
    })
    .sort((a, b) => b.points - a.points || b.rate - a.rate);

  const leagueResults = results.filter((r) => norm(r.league) === leagueKey);

  const ordered: { row: Scored; tied: boolean }[] = [];
  let i = 0;
  while (i < scored.length) {
    let j = i + 1;
    while (
      j < scored.length &&
      scored[j].points === scored[i].points &&
      scored[j].rate === scored[i].rate
    ) {
      j++;
    }

    const group = scored.slice(i, j);
    if (group.length === 1) {
      ordered.push({ row: group[0], tied: false });
    } else {
      const h2h = headToHeadWins(group, leagueResults);
      group
        .sort(
          (a, b) =>
            (h2h.get(norm(b.team)) ?? 0) - (h2h.get(norm(a.team)) ?? 0) ||
            b.wins - a.wins ||
            a.team.localeCompare(b.team, "en", { sensitivity: "base" })
        )
        .forEach((row) => ordered.push({ row, tied: true }));
    }
    i = j;
  }

  return ordered.map(({ row, tied }, index) => ({
    pos: index + 1,
    team: row.team,
    tag: row.tag,
    wins: row.wins,
    losses: row.losses,
    pct: formatPct(row.rate),
    tied,
  }));
}
