"use client";

import { useState } from "react";
import IdentityHeader from "@/components/profile/IdentityHeader";
import GameAccountsSection from "@/components/profile/GameAccountsSection";
import ConnectionsSection from "@/components/profile/ConnectionsSection";
import MyTeamsSection from "@/components/profile/MyTeamsSection";
import MarketPresenceSection from "@/components/profile/MarketPresenceSection";
import SecuritySection from "@/components/profile/SecuritySection";
import type {
  AccountConnection,
  AccountLoadErrors,
  AccountProfile,
  BlockedUser,
  GameAccount,
  GameProfile,
  MutedUser,
  PlayerListing,
  TeamMembership,
} from "@/components/profile/account-types";

type Props = {
  profile: AccountProfile;
  email: string;
  gameAccounts: GameAccount[];
  gameProfiles: GameProfile[];
  connections: AccountConnection[];
  memberships: TeamMembership[];
  listings: PlayerListing[];
  blockedUsers: BlockedUser[];
  mutedUsers: MutedUser[];
  loadErrors: AccountLoadErrors;
};

export default function ProfileClient({
  profile: initialProfile,
  email,
  gameAccounts,
  gameProfiles,
  connections,
  memberships,
  listings,
  blockedUsers,
  mutedUsers,
  loadErrors,
}: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const updateProfile = (changes: Partial<AccountProfile>) => {
    setProfile((current) => ({ ...current, ...changes }));
  };

  return (
    <main id="main-content" className="profile-account-page">
      <div className="page-header">
        <div className="wrap">
          <span className="breadcrumb">Home / My Account</span>
          <h1 style={{ marginTop: "1rem" }}>My Account</h1>
          <p>Manage your player identity, teams, and account security.</p>
        </div>
      </div>
      <div className="wrap profile-account-content">
        {profile.onboarding_completed === false && (
          <OnboardingNudge step={profile.onboarding_step} />
        )}
        <div className="profile-account-grid">
          <IdentityHeader
            mode="account"
            profile={profile}
            email={email}
            onProfileChange={updateProfile}
            loadError={loadErrors.profile}
          />
          <GameAccountsSection
            mode="account"
            profileId={profile.id}
            accounts={gameAccounts}
            gameProfiles={gameProfiles}
            loadError={loadErrors.games}
          />
          <ConnectionsSection
            profileId={profile.id}
            connections={connections}
            loadError={loadErrors.connections}
          />
          <MyTeamsSection
            mode="account"
            profileId={profile.id}
            memberships={memberships}
            loadError={loadErrors.teams}
          />
          <MarketPresenceSection
            mode="account"
            profileId={profile.id}
            listings={listings}
            loadError={loadErrors.market}
          />
          <SecuritySection
            profileId={profile.id}
            email={email}
            blockedUsers={blockedUsers}
            mutedUsers={mutedUsers}
            loadError={loadErrors.privacy}
          />
        </div>
      </div>
    </main>
  );
}

function OnboardingNudge({ step }: { step: number | null }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <aside className="profile-onboarding-nudge">
      <div>
        <strong>Complete your setup</strong>
        <p>Finish your player profile to unlock the full R3IGN experience.</p>
      </div>
      <a className="btn btn-primary" href={`/onboarding?step=${step ?? 1}`}>
        Continue setup
      </a>
      <button
        className="profile-nudge-dismiss"
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss setup reminder for this session"
      >
        ×
      </button>
    </aside>
  );
}
