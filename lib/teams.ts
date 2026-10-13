import type { SupabaseClient } from "@supabase/supabase-js";
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

/** URL slug for a team page (`/org?name=<slug>`); same rule as the team page. */
export function orgSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
 * Admin-confirmed match results, used for the head-to-head and points
 * differential tiebreakers.
 *
 * Reads the `public_match_results` view, which exposes only the safe columns
 * of confirmed matches (the `match_results` table itself is private). If the
 * view has not been created yet, this returns an empty list and the tiebreak
 * falls back to total wins.
 */
export async function getConfirmedResults(): Promise<MatchResult[]> {
  const supabase = await createClient();
  // The view is not in the generated database types, so the client is widened
  // for this one query.
  const { data, error } = await (supabase as unknown as SupabaseClient)
    .from("public_match_results")
    .select("league, team_a, team_b, score_a, score_b");

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
