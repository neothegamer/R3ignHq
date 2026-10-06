"use client";

import Link from "next/link";
import IdentityHeader from "./IdentityHeader";
import GameAccountsSection from "./GameAccountsSection";
import MyTeamsSection from "./MyTeamsSection";
import MarketPresenceSection from "./MarketPresenceSection";
import type {
  AccountProfile,
  PublicAward,
  PublicGameAccount,
  PublicPlayerListing,
  TeamMembership,
} from "./account-types";

export default function PublicProfileView({
  profile,
  isOwner,
  gameAccounts,
  memberships,
  listings,
  awards,
}: {
  profile: AccountProfile;
  isOwner: boolean;
  gameAccounts: PublicGameAccount[];
  memberships: TeamMembership[];
  listings: PublicPlayerListing[];
  awards: PublicAward[];
}) {
  return (
    <main id="main-content" className="public-profile-page">
      {isOwner && (
        <div className="public-profile-owner-banner">
          <span>This is your public profile</span>
          <Link href="/account">Manage profile →</Link>
        </div>
      )}

      <div className="public-profile-sections wrap">
        <IdentityHeader mode="public" profile={profile} />

        {gameAccounts.length > 0 && (
          <GameAccountsSection
            mode="public"
            profileId={profile.id}
            accounts={[]}
            publicAccounts={gameAccounts}
            gameProfiles={[]}
          />
        )}

        {memberships.length > 0 && (
          <MyTeamsSection
            mode="public"
            profileId={profile.id}
            memberships={memberships}
          />
        )}

        {listings.some((listing) => listing.status === "active") && (
          <MarketPresenceSection
            mode="public"
            profileId={profile.id}
            listings={[]}
            publicListings={listings}
          />
        )}

        {awards.length > 0 && (
          <section className="section-tight">
            <h2 className="public-profile-section-title">Awards</h2>
            <div className="public-profile-grid">
              {awards.map((award, index) => (
                <article
                  className="public-profile-card"
                  key={`${award.award_label}-${award.created_at}-${index}`}
                >
                  <span className="eyebrow">
                    {award.season || "R3IGN Award"}
                  </span>
                  <h3>{award.award_label}</h3>
                  {award.context && <p>{award.context}</p>}
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
