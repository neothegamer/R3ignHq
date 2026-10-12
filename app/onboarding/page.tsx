import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/supabase/auth";
import OnboardingClient, {
  type OnboardingGameId,
  type OnboardingInitialData,
} from "./OnboardingClient";

export const metadata: Metadata = {
  title: "Player Setup · R3IGN HQ",
  description:
    "Complete your R3IGN player profile — identity, games, connections, and community.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { supabase, user } = await getServerAuth();
  if (!user) redirect("/signin?redirect=/onboarding");

  const { edit } = await searchParams;
  const allowEdit = edit === "1";

  const [profileResult, gameProfilesResult, connectionsResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "display_name, country, bio, player_id, league_id, avatar_url, selected_games, r3ign_hq_joined, onboarding_step, onboarding_completed"
        )
        .eq("id", user.id)
        .single(),
      supabase
        .from("game_profiles")
        .select("game, ign, player_uid, country, role, team_clan, experience")
        .eq("profile_id", user.id),
      supabase
        .from("connections")
        .select("provider, username")
        .eq("profile_id", user.id),
    ]);

  if (profileResult.error) throw profileResult.error;
  const profile = profileResult.data;
  if (!profile) {
    throw new Error("The signed-in account has no profile record.");
  }

  if (profile.onboarding_completed && !allowEdit) {
    const destId = profile.player_id || profile.league_id || user.id;
    redirect(`/player/${encodeURIComponent(destId)}`);
  }

  const validGames: OnboardingGameId[] = ["codm", "freefire", "bloodstrike"];
  const gameProfiles: OnboardingInitialData["gameProfiles"] = {};
  for (const row of gameProfilesResult.data ?? []) {
    if (!validGames.includes(row.game as OnboardingGameId)) continue;
    gameProfiles[row.game as OnboardingGameId] = {
      ign: row.ign ?? "",
      player_uid: row.player_uid ?? "",
      country: row.country ?? "",
      role: row.role ?? "",
      team_clan: row.team_clan ?? "",
      experience: row.experience ?? "",
    };
  }

  const initial: OnboardingInitialData = {
    userId: user.id,
    displayName: profile.display_name ?? "",
    country: profile.country ?? "Nigeria",
    bio: profile.bio ?? "",
    playerId: profile.player_id || profile.league_id || "",
    avatarUrl: profile.avatar_url ?? null,
    selectedGames: (profile.selected_games ?? []).filter((game) =>
      validGames.includes(game as OnboardingGameId)
    ) as OnboardingGameId[],
    hqJoined: Boolean(profile.r3ign_hq_joined),
    step: profile.onboarding_step ?? 1,
    gameProfiles,
    connections: (connectionsResult.data ?? []).map((row) => ({
      provider: row.provider,
      username: row.username ?? null,
    })),
    linkedProviders: (user.identities ?? []).map((identity) =>
      identity.provider.toLowerCase()
    ),
  };

  return (
    <main id="main-content" className="ob-wrap">
      <header className="ob-header">
        <span className="eyebrow">Player Setup</span>
        <h1>Build Your R3IGN Profile</h1>
        <p className="lede">
          Six quick steps. Your progress is saved automatically — leave and
          come back any time.
        </p>
      </header>
      <OnboardingClient initial={initial} />
    </main>
  );
}