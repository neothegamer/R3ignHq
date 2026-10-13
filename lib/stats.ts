import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type SiteStats = {
  /** Leagues R3IGN HQ runs. */
  leagues: number;
  teams: number;
  players: number;
  matches: number;
};

/** Real numbers for the stat strips. A count that can't be read comes back as 0. */
export async function getSiteStats(): Promise<SiteStats> {
  const supabase = await createClient();

  const [teams, players, matches] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    // Confirmed matches only, through the public view (the table is private).
    (supabase as unknown as SupabaseClient)
      .from("public_match_results")
      .select("id", { count: "exact", head: true }),
  ]);

  return {
    leagues: 3,
    teams: teams.error ? 0 : (teams.count ?? 0),
    players: players.error ? 0 : (players.count ?? 0),
    matches: matches.error ? 0 : (matches.count ?? 0),
  };
}

/** Shows a number, or an em dash when there is nothing real to show yet. */
export function statValue(n: number) {
  return n > 0 ? n.toLocaleString("en-US") : "—";
}
