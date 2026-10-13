import { createClient } from "@/lib/supabase/server";
import type { LiveRanking, MatchResult } from "@/lib/standings";

/**
 * Single source of truth for team data.
 *
 * Leagues, Divisions, Rankings and Organizations all read from here, so team
 * counts can never disagree between pages. Every count is computed from the
 * `organizations` table (registered teams); standings come from `rankings`.
 */

export type OrgSummary = {
  id: string;
  name: string;
  tag: string;
  league: string;
  division: number | null;
  region: string | null;
  logo_url: string | null;
};

export type RankingSummary = LiveRanking & {
  organization_id: string | null;
};

export async function getOrganizations(): Promise<OrgSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, tag, league, division, region, logo_url")
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data as OrgSummary[];
}

export async function getRankings(): Promise<RankingSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rankings")
    .select("organization_id, team_name, tag, league, wins, losses, points");

  if (error || !data) return [];
  return data as RankingSummary[];
}

/**
 * Admin-confirmed match results, used only for the head-to-head tiebreaker.
 * If the table can't be read (for example row-level security blocks public
 * reads), this returns an empty list and the tiebreaker falls back to wins.
 */
export async function getConfirmedResults(): Promise<MatchResult[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("match_results")
    .select("league, team_a, team_b, score_a, score_b")
    .not("confirmed_at", "is", null);

  if (error || !data) return [];
  return data as MatchResult[];
}

/** Number of registered organizations in a league (case-insensitive). */
export function countByLeague(orgs: OrgSummary[], league: string): number {
  const key = league.trim().toLowerCase();
  return orgs.filter((o) => (o.league ?? "").trim().toLowerCase() === key)
    .length;
}

/**
 * Number of organizations on each rung of a league's division ladder (1-6).
 * Organizations with no division set count as Division 6 (Entry), because
 * every organization starts there.
 */
export function countByDivision(
  orgs: OrgSummary[],
  league: string
): Record<number, number> {
  const key = league.trim().toLowerCase();
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  for (const org of orgs) {
    if ((org.league ?? "").trim().toLowerCase() !== key) continue;
    const division = org.division ?? 6;
    if (division >= 1 && division <= 6) counts[division] += 1;
  }
  return counts;
}
