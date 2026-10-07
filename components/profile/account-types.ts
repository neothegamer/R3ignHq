import type { Database } from "@/lib/database.types";

type Tables = Database["public"]["Tables"];

export type AccountProfile = Pick<
  Tables["profiles"]["Row"],
  | "id"
  | "display_name"
  | "league_id"
  | "player_id"
  | "avatar_url"
  | "country"
  | "bio"
  | "onboarding_step"
  | "onboarding_completed"
  | "selected_games"
  | "r3ign_hq_joined"
  | "created_at"
>;

export type GameAccount = Pick<
  Tables["game_accounts"]["Row"],
  | "id"
  | "game"
  | "ign"
  | "game_uid"
  | "verification_status"
  | "verification_code"
  | "updated_at"
>;

export type PublicGameAccount = Pick<
  Tables["game_accounts"]["Row"],
  "game" | "ign" | "game_uid" | "verification_status"
>;

export type GameProfile = Pick<
  Tables["game_profiles"]["Row"],
  "game" | "ign" | "player_uid" | "team_clan" | "role"
>;

export type TeamMembership = {
  id: string;
  organizationId: string;
  role: string;
  status: string;
  joinedAt: string;
  organizationName: string | null;
  inviterName: string | null;
};

export type PlayerListing = Pick<
  Tables["player_listings"]["Row"],
  "id" | "ign" | "role" | "league" | "status"
>;

export type PublicPlayerListing = Pick<
  PlayerListing,
  "id" | "ign" | "role" | "league" | "status"
>;

export type PublicAward = Pick<
  Tables["award_winners"]["Row"],
  "award_label" | "context" | "season" | "created_at"
>;

export type BlockedUser = {
  blockedId: string;
  displayName: string | null;
};

export type MutedUser = {
  mutedId: string;
  displayName: string | null;
};

export type AccountLoadErrors = Partial<
  Record<
    "profile" | "games" | "teams" | "privacy",
    string
  >
>;
