import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";
import { createClient } from "@/lib/supabase/server";
import type {
  AccountLoadErrors,
  AccountProfile,
  BlockedUser,
  GameAccount,
  GameProfile,
  MutedUser,
  PlayerListing,
  TeamMembership,
  AccountConnection,
} from "@/components/profile/account-types";

export const metadata: Metadata = {
  title: "My Account · R3IGN HQ",
  description: "Manage your R3IGN HQ profile, teams, and account security.",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const [
    profileResult,
    gameAccountsResult,
    gameProfilesResult,
    connectionsResult,
    membershipsResult,
    listingsResult,
    blocksResult,
    mutesResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id,display_name,league_id,player_id,avatar_url,country,bio,onboarding_step,onboarding_completed,selected_games,r3ign_hq_joined,created_at"
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("game_accounts")
      .select(
        "id,game,ign,game_uid,verification_status,verification_code,updated_at"
      )
      .eq("profile_id", user.id)
      .order("game"),
    supabase
      .from("game_profiles")
      .select("game,ign,player_uid,team_clan,role")
      .eq("profile_id", user.id),
    supabase
      .from("connections")
      .select("id,provider,username,connected_at")
      .eq("profile_id", user.id)
      .order("connected_at", { ascending: false }),
    supabase
      .from("organization_members")
      .select(
        "id,organization_id,role,status,joined_at,organization:organizations(name),inviter:profiles!organization_members_invited_by_fkey(display_name)"
      )
      .eq("profile_id", user.id)
      .order("joined_at", { ascending: false }),
    supabase
      .from("player_listings")
      .select("*")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_blocks")
      .select(
        "blocked_id,blocked_profile:profiles!user_blocks_blocked_id_fkey(display_name)"
      )
      .eq("blocker_id", user.id),
    supabase
      .from("user_mutes")
      .select(
        "muted_id,muted_profile:profiles!user_mutes_muted_id_fkey(display_name)"
      )
      .eq("muter_id", user.id),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (!profileResult.data) {
    throw new Error("The signed-in account has no profile record.");
  }

  const loadErrors: AccountLoadErrors = {};
  if (gameAccountsResult.error || gameProfilesResult.error) {
    loadErrors.games = [
      gameAccountsResult.error?.message,
      gameProfilesResult.error?.message,
    ]
      .filter(Boolean)
      .join(" ");
  }
  if (connectionsResult.error) {
    loadErrors.connections = connectionsResult.error.message;
  }
  if (membershipsResult.error) loadErrors.teams = membershipsResult.error.message;
  if (listingsResult.error) loadErrors.market = listingsResult.error.message;
  if (blocksResult.error || mutesResult.error) {
    loadErrors.privacy = [
      blocksResult.error?.message,
      mutesResult.error?.message,
    ]
      .filter(Boolean)
      .join(" ");
  }

  const memberships: TeamMembership[] = (membershipsResult.data ?? []).map(
    (membership) => ({
      id: membership.id,
      organizationId: membership.organization_id,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joined_at,
      organizationName: membership.organization?.name ?? null,
      inviterName: membership.inviter?.display_name ?? null,
    })
  );

  const blockedUsers: BlockedUser[] = (blocksResult.data ?? []).map((row) => ({
    blockedId: row.blocked_id,
    displayName: row.blocked_profile?.display_name ?? null,
  }));
  const mutedUsers: MutedUser[] = (mutesResult.data ?? []).map((row) => ({
    mutedId: row.muted_id,
    displayName: row.muted_profile?.display_name ?? null,
  }));

  return (
    <ProfileClient
      profile={profileResult.data as AccountProfile}
      email={user.email ?? ""}
      gameAccounts={(gameAccountsResult.data ?? []) as GameAccount[]}
      gameProfiles={(gameProfilesResult.data ?? []) as GameProfile[]}
      connections={(connectionsResult.data ?? []) as AccountConnection[]}
      memberships={memberships}
      listings={(listingsResult.data ?? []) as PlayerListing[]}
      blockedUsers={blockedUsers}
      mutedUsers={mutedUsers}
      loadErrors={loadErrors}
    />
  );
}
