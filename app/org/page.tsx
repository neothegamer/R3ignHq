import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Team Profile · R3IGN HQ",
  description:
    "Team and organization profile — roster, league record, and socials.",
  openGraph: {
    title: "Team Profile · R3IGN HQ",
    description:
      "Team and organization profile — roster, league record, and socials.",
    type: "website",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
  twitter: {
    card: "summary",
    title: "Team Profile · R3IGN HQ",
    description:
      "Team and organization profile — roster, league record, and socials.",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
};

type RecordRow = {
  league: string;
  season: string;
  record: string;
  pct: string;
};

type OrgProfile = {
  name: string;
  tag: string;
  league: string;
  division: number | null;
  region: string;
  record: string;
  pct: string;
  description: string;
  roster: string;
  discord_url: string;
  twitch_url: string;
  twitter_url: string;
  records?: RecordRow[];
};

type OrgRow = {
  id: string;
  name: string;
  tag: string;
  league: string;
  division: number | null;
  region: string | null;
};

type RankingRow = {
  organization_id: string | null;
  team_name: string;
  league: string | null;
  season: string | null;
  wins: number | null;
  losses: number | null;
};

type OrgMember = {
  role: string;
  joined_at: string;
  display_name: string | null;
  league_id: string | null;
  player_id: string | null;
  avatar_url: string | null;
};

const SAMPLE_ORGS: Record<string, OrgProfile> = {
  "aether-esports": {
    name: "Aether Esports",
    tag: "AE",
    league: "rcml",
    division: 1,
    region: "Sample Data",
    record: "W10–L1",
    pct: "90.9%",
    description:
      "Sample profile — connect Supabase and register real organizations to replace this.",
    roster:
      "Add a roster from the Admin page or Supabase once this org signs up.",
    discord_url: "",
    twitch_url: "",
    twitter_url: "",
  },
  siroxx: {
    name: "Siroxx",
    tag: "SX",
    league: "rcml",
    division: 1,
    region: "Sample Data",
    record: "W10–L1",
    pct: "90.9%",
    description:
      "Sample profile — connect Supabase and register real organizations to replace this.",
    roster:
      "Add a roster from the Admin page or Supabase once this org signs up.",
    discord_url: "",
    twitch_url: "",
    twitter_url: "",
  },
  infinite: {
    name: "Infinite",
    tag: "IN",
    league: "rcml",
    division: 1,
    region: "Sample Data",
    record: "W9–L2",
    pct: "81.8%",
    description:
      "Sample profile — connect Supabase and register real organizations to replace this.",
    roster:
      "Add a roster from the Admin page or Supabase once this org signs up.",
    discord_url: "",
    twitch_url: "",
    twitter_url: "",
  },
  "eleventh-order": {
    name: "Eleventh Order",
    tag: "EO",
    league: "rcml",
    division: 1,
    region: "Sample Data",
    record: "W8–L3",
    pct: "72.7%",
    description:
      "Sample profile — connect Supabase and register real organizations to replace this.",
    roster:
      "Add a roster from the Admin page or Supabase once this org signs up.",
    discord_url: "",
    twitch_url: "",
    twitter_url: "",
  },
  "seven-esports": {
    name: "Seven Esports",
    tag: "SE",
    league: "rcml",
    division: 1,
    region: "Sample Data",
    record: "W7–L4",
    pct: "63.6%",
    description:
      "Sample profile — connect Supabase and register real organizations to replace this.",
    roster:
      "Add a roster from the Admin page or Supabase once this org signs up.",
    discord_url: "",
    twitch_url: "",
    twitter_url: "",
  },
  "7sin-esports": {
    name: "7SIN Esports",
    tag: "7S",
    league: "rcml",
    division: 1,
    region: "Sample Data",
    record: "W6–L5",
    pct: "54.5%",
    description:
      "Sample profile — connect Supabase and register real organizations to replace this.",
    roster:
      "Add a roster from the Admin page or Supabase once this org signs up.",
    discord_url: "",
    twitch_url: "",
    twitter_url: "",
  },
  nightshade: {
    name: "Nightshade",
    tag: "NS",
    league: "rcml",
    division: 1,
    region: "Sample Data",
    record: "W5–L6",
    pct: "45.5%",
    description:
      "Sample profile — connect Supabase and register real organizations to replace this.",
    roster:
      "Add a roster from the Admin page or Supabase once this org signs up.",
    discord_url: "",
    twitch_url: "",
    twitter_url: "",
  },
  ironclad: {
    name: "Ironclad",
    tag: "IC",
    league: "rcml",
    division: 1,
    region: "Sample Data",
    record: "W4–L7",
    pct: "36.4%",
    description:
      "Sample profile — connect Supabase and register real organizations to replace this.",
    roster:
      "Add a roster from the Admin page or Supabase once this org signs up.",
    discord_url: "",
    twitch_url: "",
    twitter_url: "",
  },
  "vortex-squad": {
    name: "Vortex Squad",
    tag: "VS",
    league: "rcml",
    division: 1,
    region: "Sample Data",
    record: "W3–L8",
    pct: "27.3%",
    description:
      "Sample profile — connect Supabase and register real organizations to replace this.",
    roster:
      "Add a roster from the Admin page or Supabase once this org signs up.",
    discord_url: "",
    twitch_url: "",
    twitter_url: "",
  },
  "last-watch": {
    name: "Last Watch",
    tag: "LW",
    league: "rcml",
    division: 1,
    region: "Sample Data",
    record: "W1–L10",
    pct: "9.1%",
    description:
      "Sample profile — connect Supabase and register real organizations to replace this.",
    roster:
      "Add a roster from the Admin page or Supabase once this org signs up.",
    discord_url: "",
    twitch_url: "",
    twitter_url: "",
  },
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function loadLiveOrg(
  slug: string
): Promise<{ live: boolean; org?: OrgProfile; members?: OrgMember[] }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, tag, league, division, region");

  if (error || !data || data.length === 0) return { live: false };

  const row = (data as OrgRow[]).find((o) => slugify(o.name) === slug);
  if (!row) return { live: true };

  const { data: memberRows, error: membersError } = await supabase
    .from("organization_members")
    .select(
      "role,joined_at,profile:profiles!organization_members_profile_id_fkey(display_name,league_id,player_id,avatar_url)"
    )
    .eq("organization_id", row.id)
    .eq("status", "active");

  if (membersError) throw membersError;

  const rolePriority: Record<string, number> = {
    owner: 0,
    captain: 1,
    coach: 2,
    manager: 2,
    player: 3,
  };
  const members: OrgMember[] = (memberRows ?? [])
    .map((member) => ({
      role: member.role,
      joined_at: member.joined_at,
      display_name: member.profile?.display_name ?? null,
      league_id: member.profile?.league_id ?? null,
      player_id: member.profile?.player_id ?? null,
      avatar_url: member.profile?.avatar_url ?? null,
    }))
    .sort((a, b) => {
      const roleOrder =
        (rolePriority[a.role.toLowerCase()] ?? 4) -
        (rolePriority[b.role.toLowerCase()] ?? 4);
      if (roleOrder !== 0) return roleOrder;

      return (a.display_name ?? "").localeCompare(b.display_name ?? "", "en", {
        sensitivity: "base",
      });
    });

  const rankingCols = "organization_id, team_name, league, season, wins, losses";

  let rankingRows: RankingRow[] = [];
  const byId = await supabase
    .from("rankings")
    .select(rankingCols)
    .eq("organization_id", row.id)
    .order("updated_at", { ascending: false });
  if (!byId.error && byId.data && byId.data.length > 0) {
    rankingRows = byId.data as RankingRow[];
  } else {
    const byName = await supabase
      .from("rankings")
      .select(rankingCols)
      .eq("team_name", row.name)
      .order("updated_at", { ascending: false });
    if (!byName.error && byName.data) {
      rankingRows = byName.data as RankingRow[];
    }
  }

  const records: RecordRow[] = rankingRows.map((r) => {
    const wins = Number(r.wins ?? 0);
    const losses = Number(r.losses ?? 0);
    const games = wins + losses;
    const rate = games > 0 ? wins / games : 0;
    return {
      league: r.league ?? row.league,
      season: r.season ?? "Current Season",
      record: `W${wins}–L${losses}`,
      pct: (rate * 100).toFixed(1) + "%",
    };
  });

  return {
    live: true,
    members,
    org: {
      name: row.name,
      tag: row.tag,
      league: (row.league ?? "").toLowerCase(),
      division: row.division,
      region: row.region ?? "",
      record: "",
      pct: "",
      description: "",
      roster: "",
      discord_url: "",
      twitch_url: "",
      twitter_url: "",
      records,
    },
  };
}

type Props = {
  searchParams: Promise<{ name?: string; id?: string }>;
};

export default async function OrgPage({ searchParams }: Props) {
  const params = await searchParams;
  const nameSlug = params.name || "";

  const result = nameSlug
    ? await loadLiveOrg(nameSlug)
    : { live: false as boolean, org: undefined as OrgProfile | undefined };

  const org: OrgProfile | undefined = result.live
    ? result.org
    : nameSlug
      ? SAMPLE_ORGS[nameSlug]
      : undefined;

  if (!org) {
    return (
      <main id="main-content">
        <div className="page-header">
          <div className="wrap">
            <span className="breadcrumb">
              <Link href="/">Home</Link> /{" "}
              <Link href="/organizations">Organizations</Link> / Team
            </span>
            <div style={{ marginTop: "1.25rem" }}>
              <span className="eyebrow" style={{ display: "inline-flex" }}>
                404
              </span>
              <h1 style={{ marginTop: "0.75rem" }}>Not Found</h1>
            </div>
          </div>
        </div>
        <section className="section-tight">
          <div className="wrap">
            <div className="empty-state">
              Couldn&rsquo;t find that organization.{" "}
              <Link href="/organizations" style={{ color: "var(--paper)" }}>
                Back to Organizations
              </Link>
              .
            </div>
          </div>
        </section>
      </main>
    );
  }

  const socials: { label: string; href: string }[] = [];
  if (org.discord_url) socials.push({ label: "Discord", href: org.discord_url });
  if (org.twitch_url) socials.push({ label: "Twitch", href: org.twitch_url });
  if (org.twitter_url)
    socials.push({ label: "Twitter / X", href: org.twitter_url });

  const recordRows: RecordRow[] =
    org.records ??
    (org.record
      ? [
          {
            league: org.league,
            season: "Current Season",
            record: org.record,
            pct: org.pct,
          },
        ]
      : []);
  const rosterMembers = result.live ? (result.members ?? []) : [];

  return (
    <main id="main-content">
      <div className="page-header" id="org-header">
        <div className="wrap">
          <span className="breadcrumb">
            <Link href="/">Home</Link> /{" "}
            <Link href="/organizations">Organizations</Link> /{" "}
            <span id="org-crumb">{org.name}</span>
          </span>
          <div id="org-hero" style={{ marginTop: "1.25rem" }}>
            <span
              className="eyebrow"
              id="org-league-badge"
              style={{ display: "inline-flex" }}
            >
              {(org.league || "R3IGN").toUpperCase()}
              {org.division ? ` · Division ${org.division}` : ""}
            </span>
            <h1 id="org-name" style={{ marginTop: "0.75rem" }}>
              {org.name}
            </h1>
            <p
              id="org-desc"
              className="lede"
              style={{ marginTop: "0.75rem", maxWidth: "60ch" }}
            >
              {org.description || "No team bio yet."}
            </p>
          </div>
        </div>
      </div>

      <section className="section-tight">
        <div className="wrap">
          <div id="org-content">
            <div
              className="dossier-grid"
              style={{
                gridTemplateColumns: "2fr 1fr",
                gap: "2rem",
              }}
            >
              <div>
                <div className="form-panel">
                  <span className="eyebrow">Roster</span>
                  {result.live ? (
                    rosterMembers.length > 0 ? (
                      <ul className="org-roster-grid" id="org-roster">
                        {rosterMembers.map((member, index) => {
                          const memberName = member.display_name || "Player";
                          const publicId = member.player_id || member.league_id;
                          const memberContent = (
                            <>
                              <span className="org-roster-avatar">
                                {member.avatar_url ? (
                                  <img src={member.avatar_url} alt="" />
                                ) : (
                                  memberName.charAt(0).toUpperCase()
                                )}
                              </span>
                              <span className="org-roster-member-info">
                                <strong>{memberName}</strong>
                                <span className="org-roster-role">
                                  {member.role}
                                </span>
                              </span>
                            </>
                          );

                          return (
                            <li
                              className="org-roster-member"
                              key={`${publicId ?? member.role}-${index}`}
                            >
                              {publicId ? (
                                <Link
                                  href={`/player/${encodeURIComponent(publicId)}`}
                                  className="org-roster-member-link"
                                >
                                  {memberContent}
                                </Link>
                              ) : (
                                <div className="org-roster-member-link">
                                  {memberContent}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="lede org-roster-empty" id="org-roster">
                        No active members listed yet.
                      </p>
                    )
                  ) : (
                    <p
                      className="lede"
                      id="org-roster"
                      style={{ marginTop: "0.75rem", whiteSpace: "pre-line" }}
                    >
                      {org.roster || "No roster listed yet."}
                    </p>
                  )}
                </div>
                <div className="form-panel mt-lg">
                  <span className="eyebrow">League Record</span>
                  <div className="table-wrap" style={{ marginTop: "1rem" }}>
                    <table className="rank-table">
                      <thead>
                        <tr>
                          <th>League</th>
                          <th>Season</th>
                          <th>W</th>
                          <th>L</th>
                          <th>Win %</th>
                        </tr>
                      </thead>
                      <tbody id="org-record-rows">
                        {recordRows.length > 0 ? (
                          recordRows.map((r, i) => (
                            <tr key={i}>
                              <td>{(r.league || "—").toUpperCase()}</td>
                              <td>{r.season}</td>
                              <td colSpan={3}>
                                {r.record} ({r.pct} win rate)
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} style={{ color: "var(--steel)" }}>
                              No matches reported yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div>
                <div
                  className="account-card"
                  style={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "1rem",
                  }}
                >
                  <div
                    className="account-avatar"
                    id="org-badge"
                    style={{ width: "56px", height: "56px" }}
                  >
                    {org.tag || "?"}
                  </div>
                  <div className="account-meta">
                    <h3 id="org-tag-full">{org.tag || "—"}</h3>
                    <p id="org-region">{org.region || "Region not set"}</p>
                  </div>
                </div>
                <div className="form-panel mt-lg">
                  <span className="eyebrow">Socials</span>
                  <ul
                    id="org-socials"
                    style={{
                      marginTop: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.6rem",
                    }}
                  >
                    {socials.length === 0 ? (
                      <li style={{ color: "var(--steel)", fontSize: "0.85rem" }}>
                        No linked socials yet.
                      </li>
                    ) : (
                      socials.map((s) => (
                        <li key={s.label}>
                          <a
                            href={s.href}
                            target="_blank"
                            rel="noopener"
                            style={{ color: "var(--paper)" }}
                          >
                            {s.label}
                          </a>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div
                  className="cta-actions"
                  style={{
                    marginTop: "1.5rem",
                    flexDirection: "column",
                    alignItems: "stretch",
                  }}
                >
                  <Link
                    href="/player-market"
                    className="btn btn-ghost btn-block"
                  >
                    Browse Player Market
                  </Link>
                  <Link href="/rankings" className="btn btn-primary btn-block">
                    Full Rankings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}