import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { countByLeague, getOrganizations } from "@/lib/teams";

/**
 * Single source of truth for season status.
 *
 * Every page that says whether a season is upcoming, in progress or finished
 * reads it from here, so the same season can never be shown as both "in
 * progress" and "won".
 *
 * The status comes from the `seasons` table (see the SQL that ships with this
 * file). If that table does not exist yet, or has no row for a league, the
 * league falls back to what the `rankings` table shows, and no claim about
 * progress is made.
 */

export type SeasonStatus = "upcoming" | "in_progress" | "completed";

export type LeagueSeason = {
  /** Upper-case league code, for example "RCML". */
  league: string;
  /** Season label as stored, for example "Season 4". Null when none exists. */
  seasonName: string | null;
  /** "unknown" = rankings exist but no season row says what state it is in. */
  status: SeasonStatus | "unknown" | "none";
  champion: string | null;
  /** Registered organizations in this league (from the shared team data). */
  teams: number;
};

export type StatusItem = { league: string; text: string; live: boolean };

const LEAGUES = ["RCML", "RFCL", "RBSL"] as const;

type SeasonRow = {
  league: string;
  name: string;
  status: string;
  champion_team: string | null;
  created_at: string | null;
};

function norm(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

async function getSeasonRows(): Promise<SeasonRow[]> {
  try {
    const supabase = await createClient();
    // `seasons` is not in the generated database types yet, so the client is
    // widened for this one query. A missing table just returns an error.
    const { data, error } = await (supabase as unknown as SupabaseClient)
      .from("seasons")
      .select("league, name, status, champion_team, created_at")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as SeasonRow[];
  } catch {
    return [];
  }
}

/** Latest season label per league, taken from the standings table. */
async function getRankedSeasons(): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("rankings")
      .select("league, season, updated_at")
      .order("updated_at", { ascending: false });

    if (error || !data) return result;
    for (const row of data) {
      const key = norm(row.league);
      if (key && row.season && !result.has(key)) result.set(key, row.season);
    }
  } catch {
    // leave the map empty
  }
  return result;
}

function isStatus(value: string): value is SeasonStatus {
  return (
    value === "upcoming" || value === "in_progress" || value === "completed"
  );
}

export async function getLeagueSeasons(): Promise<LeagueSeason[]> {
  const [orgs, rankedSeasons, seasonRows] = await Promise.all([
    getOrganizations(),
    getRankedSeasons(),
    getSeasonRows(),
  ]);

  return LEAGUES.map((league) => {
    const key = norm(league);
    const teams = countByLeague(orgs, key);

    const rows = seasonRows.filter(
      (row) => norm(row.league) === key && isStatus(row.status)
    );
    // Rows are newest first. A season in progress always wins.
    const current = rows.find((r) => r.status === "in_progress") ?? rows[0];

    if (current) {
      return {
        league,
        seasonName: current.name,
        status: current.status as SeasonStatus,
        champion:
          current.status === "completed" ? current.champion_team : null,
        teams,
      };
    }

    const rankedSeason = rankedSeasons.get(key);
    if (rankedSeason) {
      return {
        league,
        seasonName: rankedSeason,
        status: "unknown" as const,
        champion: null,
        teams,
      };
    }

    return {
      league,
      seasonName: null,
      status: "none" as const,
      champion: null,
      teams,
    };
  });
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** The scrolling league ticker in the header, built only from real data. */
export function toStatusItems(seasons: LeagueSeason[]): StatusItem[] {
  return seasons.map((s) => {
    const name = s.seasonName ?? "Season";
    switch (s.status) {
      case "in_progress":
        return { league: s.league, text: `${name} in progress`, live: true };
      case "completed":
        return {
          league: s.league,
          text: s.champion
            ? `${name} complete · Champion: ${s.champion}`
            : `${name} complete`,
          live: false,
        };
      case "upcoming":
        return { league: s.league, text: `${name} starting soon`, live: false };
      case "unknown":
        return {
          league: s.league,
          text: `${name} · ${plural(s.teams, "team")}`,
          live: false,
        };
      default:
        return {
          league: s.league,
          text: "Registration opening soon",
          live: false,
        };
    }
  });
}

export type SeasonCard = {
  league: string;
  /** Season label as stored. Null when the league has no season yet. */
  name: string | null;
  status: SeasonStatus | "unknown" | "none";
  champion: string | null;
};

/**
 * One card per season for the "Champions" rail on the home page: every season
 * in the `seasons` table (oldest first, per league), and for a league with no
 * season rows a single card built from {@link getLeagueSeasons}.
 */
export async function getSeasonCards(): Promise<SeasonCard[]> {
  const [rows, current] = await Promise.all([
    getSeasonRows(),
    getLeagueSeasons(),
  ]);

  const cards: SeasonCard[] = [];
  for (const league of LEAGUES) {
    const key = norm(league);
    const own = rows
      .filter((row) => norm(row.league) === key && isStatus(row.status))
      .reverse(); // rows arrive newest first

    if (own.length > 0) {
      for (const row of own) {
        cards.push({
          league,
          name: row.name,
          status: row.status as SeasonStatus,
          champion: row.status === "completed" ? row.champion_team : null,
        });
      }
      continue;
    }

    const fallback = current.find((c) => c.league === league);
    cards.push({
      league,
      name: fallback?.seasonName ?? null,
      status: fallback?.status ?? "none",
      champion: null,
    });
  }
  return cards;
}
