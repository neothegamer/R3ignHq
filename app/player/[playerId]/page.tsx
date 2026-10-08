import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PublicProfileView from "@/components/profile/PublicProfileView";
import type {
  AccountProfile,
  PublicAward,
  PublicGameAccount,
  PublicPlayerListing,
  TeamMembership,
} from "@/components/profile/account-types";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ playerId: string }>;
};

export const metadata: Metadata = {
  title: "Player Profile · R3IGN HQ",
  description: "Public player profile on R3IGN HQ.",
};

export default async function PlayerProfilePage({ params }: PageProps) {
  const { playerId } = await params;
  const raw = (playerId ?? "").trim();
  const normalizedPlayerId = raw.toUpperCase();
  const normalizedWithoutHyphen = normalizedPlayerId.replace(/-/g, "");
  const playerCandidates = Array.from(
    new Set([
      normalizedPlayerId,
      normalizedWithoutHyphen,
      normalizedPlayerId.replace(/^R3N\-?/i, "R3N-"),
      normalizedPlayerId.replace(/^R3E\-?/i, "R3E"),
      normalizedPlayerId.replace(/^R3N/i, "R3N-"),
      normalizedPlayerId.replace(/^R3E/i, "R3E"),
    ])
  ).filter(Boolean);

  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, display_name, league_id, player_id, avatar_url, country, created_at, bio, selected_games"
    )
    .in("player_id", playerCandidates)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) notFound();

  const [
    { data: viewerData, error: viewerError },
    { data: gameAccounts, error: gameAccountsError },
    { data: memberships, error: membershipsError },
    { data: listings, error: listingsError },
    { data: awards, error: awardsError },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("game_accounts")
      .select("game, ign, game_uid, verification_status")
      .eq("profile_id", profile.id),
    supabase
      .from("organization_members")
      .select("id, organization_id, role, status, joined_at, organization:organizations(name)")
      .eq("profile_id", profile.id)
      .eq("status", "active"),
    supabase
      .from("player_listings")
      .select("id, ign, role, league, status")
      .eq("profile_id", profile.id)
      .eq("status", "active")
      .limit(1),
    supabase
      .from("award_winners")
      .select("award_label, context, season, created_at")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  if (viewerError && viewerError.name !== "AuthSessionMissingError") {
    console.error("Could not check public profile owner:", viewerError);
  }
  if (gameAccountsError) {
    console.error("Could not load public game accounts:", gameAccountsError);
  }
  if (membershipsError) {
    console.error("Could not load public team memberships:", membershipsError);
  }
  if (listingsError) {
    console.error("Could not load public player listing:", listingsError);
  }
  if (awardsError) {
    console.error("Could not load public profile awards:", awardsError);
  }

  const publicProfile: AccountProfile = {
    id: profile.id,
    display_name: profile.display_name,
    league_id: profile.league_id,
    player_id: profile.player_id || profile.league_id,
    avatar_url: profile.avatar_url,
    country: profile.country,
    created_at: profile.created_at,
    bio: profile.bio,
    selected_games: profile.selected_games,
    onboarding_step: null,
    onboarding_completed: null,
    r3ign_hq_joined: null,
  };

  const publicMemberships: TeamMembership[] = (memberships ?? []).flatMap(
    (membership) => {
      const organization = membership.organization as { name: string | null } | null;
      return organization?.name
        ? [
            {
              id: membership.id,
              organizationId: membership.organization_id,
              role: membership.role,
              status: membership.status,
              joinedAt: membership.joined_at ?? profile.created_at ?? "",
              organizationName: organization.name,
              inviterName: null,
            },
          ]
        : [];
    }
  );

  return (
    <PublicProfileView
      profile={publicProfile}
      isOwner={viewerData.user?.id === profile.id}
      gameAccounts={(gameAccounts ?? []) as PublicGameAccount[]}
      memberships={publicMemberships}
      listings={(listings ?? []) as PublicPlayerListing[]}
      awards={(awards ?? []) as PublicAward[]}
    />
  );
}