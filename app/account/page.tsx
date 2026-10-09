import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { UserIdentity } from "@supabase/supabase-js";
import ProfileClient from "./ProfileClient";
import { getServerAuth } from "@/lib/supabase/auth";
import type {
  AccountLoadErrors,
  AccountProfile,
  BlockedUser,
  GameAccount,
  GameProfile,
  MutedUser,
  TeamMembership,
} from "@/components/profile/account-types";

export const metadata: Metadata = {
  title: "My Account · R3IGN HQ",
  description: "Manage your R3IGN HQ profile, teams, and account security.",
};

export default async function AccountPage() {
  const { supabase, user } = await getServerAuth();
  if (!user) redirect("/signin");

  const [
    profileResult,
    gameAccountsResult,
    gameProfilesResult,
    membershipsResult,
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
      .from("organization_members")
      .select(
        "id,organization_id,role,status,joined_at,organization:organizations(name),inviter:profiles!organization_members_invited_by_fkey(display_name)"
      )
      .eq("profile_id", user.id)
      .order("joined_at", { ascending: false }),
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
  if (membershipsResult.error) loadErrors.teams = membershipsResult.error.message;
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


  // Backfill game_accounts from onboarding game_profiles (id mapping)
  const ONBOARDING_TO_ACCOUNT: Record<string, string> = {
    codm: "rcml",
    freefire: "rfcl",
    bloodstrike: "rbsl",
    rcml: "rcml",
    rfcl: "rfcl",
    rbsl: "rbsl",
  };

  let gameAccounts = (gameAccountsResult.data ?? []) as GameAccount[];
  const existingGames = new Set(gameAccounts.map((a) => a.game));
  const profiles = gameProfilesResult.data ?? [];
  const toInsert: { profile_id: string; game: string; ign: string; game_uid: string | null }[] = [];

  for (const gp of profiles) {
    const accountGame = ONBOARDING_TO_ACCOUNT[String(gp.game).toLowerCase()];
    if (!accountGame || existingGames.has(accountGame)) continue;
    const ign = (gp.ign ?? "").trim();
    if (!ign) continue;
    toInsert.push({
      profile_id: user.id,
      game: accountGame,
      ign,
      game_uid: (gp.player_uid ?? "").trim() || null,
    });
  }

  if (toInsert.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from("game_accounts")
      .upsert(toInsert, { onConflict: "profile_id,game" })
      .select(
        "id,game,ign,game_uid,verification_status,verification_code,updated_at"
      );
    if (insertError) {
      console.warn("Could not backfill game_accounts from onboarding:", insertError);
    } else if (inserted?.length) {
      const byGame = new Map(gameAccounts.map((a) => [a.game, a]));
      for (const row of inserted) byGame.set(row.game, row as GameAccount);
      gameAccounts = Array.from(byGame.values()).sort((a, b) =>
        a.game.localeCompare(b.game)
      );
    }
  }

  const discordIdentity = user.identities?.find(
    (identity) => identity.provider.toLowerCase() === "discord"
  );

  return (
    <ProfileClient
      profile={profileResult.data as AccountProfile}
      email={user.email ?? ""}
      gameAccounts={gameAccounts}
      gameProfiles={(gameProfilesResult.data ?? []) as GameProfile[]}
      discordIdentity={
        discordIdentity
          ? { username: getDiscordUsername(discordIdentity) }
          : null
      }
      identityCount={user.identities?.length ?? 0}
      memberships={memberships}
      blockedUsers={blockedUsers}
      mutedUsers={mutedUsers}
      loadErrors={loadErrors}
    />
  );
}

function getDiscordUsername(identity: UserIdentity): string | null {
  for (const key of ["username", "global_name", "full_name", "name"]) {
    const value = identity.identity_data?.[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}
