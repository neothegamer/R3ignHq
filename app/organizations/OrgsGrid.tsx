"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SiteSearch from "@/components/SiteSearch";
import { buildStandings, winRate, formatPct } from "@/lib/standings";
import type { MatchResult } from "@/lib/standings";
import type { OrgSummary, RankingSummary } from "@/lib/teams";

type Org = {
  slug: string;
  league: string;
  rank: string;
  tag: string;
  name: string;
  logoUrl: string | null;
  record: string;
  pct: string;
  bar: string;
  pos: number;
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildOrgs(
  orgs: OrgSummary[],
  rankings: RankingSummary[],
  results: MatchResult[]
): Org[] {
  // Positions use the exact same ordering as the Rankings page.
  const posByLeagueAndTeam = new Map<string, number>();
  const leagues = Array.from(
    new Set(
      rankings.map((r) => (r.league ?? "").trim().toLowerCase()).filter(Boolean)
    )
  );
  for (const league of leagues) {
    for (const row of buildStandings(rankings, league, results)) {
      posByLeagueAndTeam.set(`${league}|${row.team.trim().toLowerCase()}`, row.pos);
    }
  }

  const byOrgId = new Map<string, RankingSummary>();
  const byName = new Map<string, RankingSummary>();
  for (const r of rankings) {
    if (r.organization_id) byOrgId.set(r.organization_id, r);
    byName.set(r.team_name.trim().toLowerCase(), r);
  }

  return orgs
    .map((o) => {
      const league = (o.league ?? "").toLowerCase();
      const leagueLabel = league.toUpperCase();
      const ranking = byOrgId.get(o.id) ?? byName.get(o.name.trim().toLowerCase());

      if (!ranking) {
        return {
          slug: slugify(o.name),
          league,
          rank: leagueLabel,
          tag: o.tag,
          name: o.name,
          logoUrl: o.logo_url,
          record: "—",
          pct: "—",
          bar: "0%",
          pos: 9999,
        };
      }

      const wins = Number(ranking.wins ?? 0);
      const losses = Number(ranking.losses ?? 0);
      const pct = formatPct(winRate(wins, losses));
      const rankingLeague = (ranking.league ?? league).trim().toLowerCase();
      const pos =
        posByLeagueAndTeam.get(
          `${rankingLeague}|${ranking.team_name.trim().toLowerCase()}`
        ) ?? 9999;

      return {
        slug: slugify(o.name),
        league,
        rank: pos === 9999 ? leagueLabel : `${leagueLabel} · #${pos}`,
        tag: o.tag,
        name: o.name,
        logoUrl: o.logo_url,
        record: `W${wins}–L${losses}`,
        pct,
        bar: pct,
        pos,
      };
    })
    .sort(
      (a, b) =>
        a.league.localeCompare(b.league) ||
        a.pos - b.pos ||
        a.name.localeCompare(b.name)
    );
}

export default function OrgsGrid({
  orgs,
  rankings,
  results,
}: {
  orgs: OrgSummary[];
  rankings: RankingSummary[];
  results: MatchResult[];
}) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const all: Org[] = useMemo(
    () => buildOrgs(orgs, rankings, results),
    [orgs, rankings, results]
  );

  const visible = all.filter((org) => {
    const matchesLeague = filter === "all" || org.league === filter;
    const searchable =
      `${org.name} ${org.tag} ${org.league} ${org.rank}`.toLowerCase();
    return matchesLeague && searchable.includes(query.trim().toLowerCase());
  });

  return (
    <>
      <SiteSearch
        value={query}
        onChange={setQuery}
        placeholder="Search organizations…"
      />
      <div className="filter-bar">
        <button
          className="filter-chip"
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className="filter-chip"
          aria-pressed={filter === "rcml"}
          onClick={() => setFilter("rcml")}
        >
          RCML
        </button>
      </div>

      {all.length === 0 ? (
        <p className="empty-state">
          No organizations have registered yet.{" "}
          <Link href="/register" style={{ color: "var(--paper)" }}>
            Register yours
          </Link>
          .
        </p>
      ) : visible.length === 0 ? (
        <p className="empty-state">No organizations match that filter.</p>
      ) : null}

      <div className="team-grid" id="org-grid">
        {visible.map((org) => (
          <Link
            key={org.slug}
            className="team-card team-item"
            data-tags={org.league}
            href={`/org?name=${org.slug}`}
          >
            <div className="team-rank">{org.rank}</div>
            <div className="team-badge" style={{ overflow: "hidden" }}>
              {org.logoUrl ? (
                <img
                  src={org.logoUrl}
                  alt={`${org.name} logo`}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                org.tag
              )}
            </div>
            <h3>{org.name}</h3>
            <div className="team-meta">
              <span>{org.record}</span>
              <span>{org.pct}</span>
            </div>
            <div className="win-bar">
              <span style={{ width: org.bar }}></span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
