"use client";

import Link from "next/link";
import IdentityHeader from "./IdentityHeader";
import GameAccountsSection from "./GameAccountsSection";
import MyTeamsSection from "./MyTeamsSection";
import MarketPresenceSection from "./MarketPresenceSection";
import type {
  AccountProfile,
  PublicAward,
  PublicConnection,
  PublicGameAccount,
  PublicGameProfile,
  PublicPlayerListing,
  TeamMembership,
} from "./account-types";

const GAME_LABELS: Record<string, string> = {
  codm: "Call of Duty: Mobile",
  freefire: "Free Fire",
  bloodstrike: "Blood Strike",
};

type Props = {
  profile: AccountProfile;
  isOwner: boolean;
  gameAccounts: PublicGameAccount[];
  gameProfiles: PublicGameProfile[];
  memberships: TeamMembership[];
  listings: PublicPlayerListing[];
  awards: PublicAward[];
  connections: PublicConnection[];
};

export default function PublicProfileView({
  profile,
  isOwner,
  gameAccounts,
  gameProfiles,
  memberships,
  listings,
  awards,
  connections,
}: Props) {
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

        {gameAccounts.length > 0 ? (
          <GameAccountsSection
            mode="public"
            profileId={profile.id}
            accounts={[]}
            publicAccounts={gameAccounts}
            gameProfiles={[]}
          />
        ) : (
          <EmptySection
            title="Verified game accounts"
            isOwner={isOwner}
            ownerHint={
              <>
                No game accounts linked yet — add your IGN and UID in{" "}
                <Link href="/account">Account settings</Link>.
              </>
            }
            visitorHint="This player hasn't linked any game accounts yet."
          />
        )}

        <CompetitiveProfileSection
          gameProfiles={gameProfiles}
          isOwner={isOwner}
        />

        {memberships.length > 0 ? (
          <MyTeamsSection
            mode="public"
            profileId={profile.id}
            memberships={memberships}
          />
        ) : (
          <EmptySection
            title="Teams"
            isOwner={isOwner}
            ownerHint={
              <>
                Not on a team yet — check the{" "}
                <Link href="/player-market">Player Market</Link> or wait for an
                organization invite.
              </>
            }
            visitorHint="This player is not on a team yet."
          />
        )}

        {listings.some((listing) => listing.status === "active") ? (
          <MarketPresenceSection
            mode="public"
            profileId={profile.id}
            listings={[]}
            publicListings={listings}
          />
        ) : (
          <EmptySection
            title="Player market"
            isOwner={isOwner}
            ownerHint={
              <>
                Not listed on the player market — list yourself from{" "}
                <Link href="/player-market">Player Market</Link> once you're
                looking for a team.
              </>
            }
            visitorHint="This player is not listed on the player market."
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

        <ConnectionsSection connections={connections} isOwner={isOwner} />
      </div>
    </main>
  );
}

function EmptySection({
  title,
  isOwner,
  ownerHint,
  visitorHint,
}: {
  title: string;
  isOwner: boolean;
  ownerHint: React.ReactNode;
  visitorHint: string;
}) {
  return (
    <section className="section-tight">
      <h2 className="public-profile-section-title">{title}</h2>
      <p className="public-profile-empty">{isOwner ? ownerHint : visitorHint}</p>
    </section>
  );
}

function CompetitiveProfileSection({
  gameProfiles,
  isOwner,
}: {
  gameProfiles: PublicGameProfile[];
  isOwner: boolean;
}) {
  return (
    <section className="section-tight">
      <h2 className="public-profile-section-title">Competitive profile</h2>
      {gameProfiles.length > 0 ? (
        <div className="public-profile-grid">
          {gameProfiles.map((gameProfile) => (
            <article
              className="public-profile-card"
              key={gameProfile.game}
            >
              <span className="eyebrow">
                {GAME_LABELS[gameProfile.game] ?? gameProfile.game}
              </span>
              <h3>{gameProfile.ign || "IGN not set"}</h3>
              <dl className="public-profile-facts">
                {gameProfile.role && (
                  <div>
                    <dt>Role</dt>
                    <dd>{gameProfile.role}</dd>
                  </div>
                )}
                {gameProfile.team_clan && (
                  <div>
                    <dt>Team / Clan</dt>
                    <dd>{gameProfile.team_clan}</dd>
                  </div>
                )}
                {gameProfile.experience && (
                  <div>
                    <dt>Experience</dt>
                    <dd>{gameProfile.experience}</dd>
                  </div>
                )}
                {gameProfile.player_uid && (
                  <div>
                    <dt>Player UID</dt>
                    <dd>{gameProfile.player_uid}</dd>
                  </div>
                )}
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <p className="public-profile-empty">
          {isOwner ? (
            <>
              No competitive details yet — finish{" "}
              <Link href="/onboarding?edit=1">setup</Link> or add them in{" "}
              <Link href="/account">Account settings</Link>.
            </>
          ) : (
            "This player hasn't added competitive details yet."
          )}
        </p>
      )}
    </section>
  );
}

function ConnectionsSection({
  connections,
  isOwner,
}: {
  connections: PublicConnection[];
  isOwner: boolean;
}) {
  if (connections.length === 0 && !isOwner) return null;

  return (
    <section className="section-tight">
      <h2 className="public-profile-section-title">Connected accounts</h2>
      {connections.length > 0 ? (
        <div className="public-profile-games">
          {connections.map((connection) => (
            <span className="public-profile-badge" key={connection.provider}>
              {connection.provider}
              {connection.username ? ` · ${connection.username}` : ""}
            </span>
          ))}
        </div>
      ) : (
        <p className="public-profile-empty">
          No social accounts connected yet — link Discord or TikTok in{" "}
          <Link href="/account">Account settings</Link>.
        </p>
      )}
    </section>
  );
}