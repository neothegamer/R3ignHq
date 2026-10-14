import Link from "next/link";
import Footer from "@/components/Footer";
import HeroVideo from "@/components/HeroVideo";
import NewsletterForm from "@/components/newsletter/NewsletterForm";
import { createClient } from "@/lib/supabase/server";
import { getSiteStats, statValue } from "@/lib/stats";
import {
  getLeagueSeasons,
  getSeasonCards,
  type LeagueSeason,
  type SeasonCard,
} from "@/lib/season";
import {
  getConfirmedResults,
  getOrganizations,
  getRankings,
} from "@/lib/teams";
import { buildStandings } from "@/lib/standings";

const LEAGUE_INFO = [
  {
    code: "RCML",
    name: "R3IGN COD:Mobile Multiplayer League",
    blurb: "Competitive 5v5 Call of Duty Mobile Multiplayer.",
  },
  {
    code: "RFCL",
    name: "R3IGN Free Fire Clash Squad League",
    blurb: "Competitive Free Fire Clash Squad operations.",
  },
  {
    code: "RBSL",
    name: "R3IGN Blood Strike Squad Fight League",
    blurb: "Competitive Blood Strike Squad Fight operations.",
  },
] as const;

/** Badge on a league card, taken from the one season-status value. */
function leagueStamp(season: LeagueSeason | undefined) {
  switch (season?.status) {
    case "in_progress":
      return { label: "In Progress", cls: "stamp-live" };
    case "completed":
      return { label: "Complete", cls: "stamp-active" };
    case "upcoming":
      return { label: "Starting Soon", cls: "stamp-soon" };
    case "unknown":
      return { label: "Active", cls: "stamp-active" };
    default:
      return { label: "Coming Soon", cls: "stamp-soon" };
  }
}

/** Text lines on a champion card, taken from the same season-status value. */
function championCopy(card: SeasonCard) {
  switch (card.status) {
    case "completed":
      return {
        name: card.champion ?? "To Be Announced",
        note: "Season complete",
      };
    case "in_progress":
      return { name: "To Be Determined", note: "Season in progress" };
    case "upcoming":
      return { name: "To Be Determined", note: "Season starting soon" };
    case "unknown":
      return { name: "To Be Determined", note: "" };
    default:
      return { name: "To Be Determined", note: "Season not yet started" };
  }
}

type FeaturedPost = {
  id: string;
  title: string;
  category: string;
  body: string;
  created_at: string;
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function excerpt(body: string) {
  const text = (body || "").replace(/\s+/g, " ").trim();
  return text.length > 140 ? text.slice(0, 140).trim() + "…" : text;
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news_posts")
    .select("id, title, category, body, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(4);

  const featured: FeaturedPost[] =
    data && data.length > 0 ? (data as FeaturedPost[]) : [];
  const [stats, seasons, seasonCards, orgs, rankingRows, results] =
    await Promise.all([
      getSiteStats(),
      getLeagueSeasons(),
      getSeasonCards(),
      getOrganizations(),
      getRankings(),
      getConfirmedResults(),
    ]);

  const topTeams = buildStandings(rankingRows, "rcml", results).slice(0, 5);
  const logoByTeam = new Map(
    orgs.map((o) => [o.name.trim().toLowerCase(), o.logo_url])
  );

  return (
    <>
      <main id="main-content">
      {/* HERO */}
      <section className="hero">
        <HeroVideo />
        <div className="wrap">
          <div className="hero-frame">
            <span className="eyebrow">R3IGN HQ</span>
            <h1>
              WE ARE COMPETITORS.
              <br />
              WE ARE CHAMPIONS.
              <br />
              <span className="fade-accent">WE ARE R3IGN.</span>
            </h1>
            <p className="hero-copy">
              Building the future of mobile esports through structured leagues,
              elite competition, and thriving gaming communities.
            </p>
            <div className="hero-actions">
              <Link href="/leagues" className="btn btn-primary">
                View The League
              </Link>
              <Link href="/register" className="btn">
                Register Your Team
              </Link>
            </div>
          </div>
          
        </div>
      </section>

      <div className="wrap">
        <div className="redaction-rule">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* STAT STRIP */}
      <div className="wrap">
        <div className="stat-strip">
          <div className="stat">
            <div className="num">{stats.leagues}</div>
            <div className="lbl">Leagues</div>
          </div>
          <div className="stat">
            <div className="num">{statValue(stats.teams)}</div>
            <div className="lbl">Teams</div>
          </div>
          <div className="stat">
            <div className="num">{statValue(stats.players)}</div>
            <div className="lbl">Players</div>
          </div>
          <div className="stat">
            <div className="num">{statValue(stats.matches)}</div>
            <div className="lbl">Matches Played</div>
          </div>
        </div>
      </div>

      {/* WHAT IS R3IGN */}
      <section>
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">What Is R3IGN?</span>
              <h2>
                More than leagues.
                <br />
                We build legacies.
              </h2>
            </div>
            <p className="lede">
              R3IGN HQ is a competitive esports ecosystem designed to provide
              professional league operations, rankings, tournaments, media
              exposure, and growth opportunities for players, teams,
              organizations, and gaming communities. Our mission is to
              establish a trusted competitive environment where talent is
              discovered, competition thrives, and champions are crowned.
            </p>
          </div>
          <div className="pillars">
            <div className="pillar">
              <div className="num">01</div>
              <h3>Community</h3>
              <p>
                Join a growing network of players, teams, and competitive
                communities.
              </p>
            </div>
            <div className="pillar">
              <div className="num">02</div>
              <h3>Fair Competition</h3>
              <p>
                Clear rules, transparent administration, and unbiased
                decision-making.
              </p>
            </div>
            <div className="pillar">
              <div className="num">03</div>
              <h3>Rankings</h3>
              <p>
                Track team and player performance with accurate competitive
                rankings.
              </p>
            </div>
          </div>
          <div className="center mt-lg">
            <Link href="/about" className="btn btn-ghost">
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>

      {/* SUPPORTED GAMES */}
      <section className="section-tight">
        <div className="wrap">
          <span className="eyebrow">Supported Games</span>
          <div className="games-strip mt-lg" style={{ marginTop: "1.5rem" }}>
            <div className="game-tile">
              <img
                src="/assets/games/call-of-duty-mobile.jpg"
                alt="Call of Duty: Mobile"
                loading="lazy"
              />
              <span>
                Call of&nbsp;Duty:
                <br />
                Mobile
              </span>
            </div>
            <div className="game-tile">
              <img
                src="/assets/games/free-fire.jpg"
                alt="Free Fire"
                loading="lazy"
              />
              <span>Free Fire</span>
            </div>
            <div className="game-tile">
              <img
                src="/assets/games/blood-strike.jpg"
                alt="Blood Strike"
                loading="lazy"
              />
              <span>Blood Strike</span>
            </div>
            <div className="game-tile" style={{ color: "var(--steel)" }}>
              <img
                src="/assets/games/pubg-mobile.jpg"
                alt="PUBG Mobile"
                loading="lazy"
              />
              <span>
                PUBG&nbsp;Mobile
                <br />
                <span style={{ fontSize: "0.6rem" }}>Coming Soon</span>
              </span>
            </div>
            <div className="game-tile" style={{ color: "var(--steel)" }}>
              <img
                src="/assets/games/mobile-legends.jpg"
                alt="Mobile Legends: Bang Bang"
                loading="lazy"
              />
              <span>
                Mobile Legends:
                <br />
                Bang Bang
                <br />
                <span style={{ fontSize: "0.6rem" }}>Coming Soon</span>
              </span>
            </div>
            <div className="game-tile" style={{ color: "var(--steel)" }}>
              <img
                src="/assets/games/arena-of-valor.jpg"
                alt="Arena of Valor"
                loading="lazy"
              />
              <span>
                Arena of&nbsp;Valor
                <br />
                <span style={{ fontSize: "0.6rem" }}>Coming Soon</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* LEAGUE TITLES */}
      <section>
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">Our League Titles</span>
              <h2>Active operations</h2>
            </div>
            <Link href="/leagues" className="btn btn-ghost">
              View All Leagues
            </Link>
          </div>
          <div className="dossier-grid">
            {LEAGUE_INFO.map((info) => {
              const season = seasons.find((x) => x.league === info.code);
              const stamp = leagueStamp(season);
              return (
                <div className="dossier" key={info.code}>
                  <div className="dossier-head">
                    <span>{info.code}</span>
                    <span className={`stamp ${stamp.cls}`}>{stamp.label}</span>
                  </div>
                  <div className="dossier-body">
                    <h3>{info.name}</h3>
                    <p>{info.blurb}</p>
                  </div>
                  <div className="dossier-foot">
                    <span>{season?.seasonName ?? "Season TBA"}</span>
                    <Link href="/leagues">View League →</Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED TEAMS */}
      <section>
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">Featured Teams</span>
              <h2>Leading the standings</h2>
            </div>
            <Link href="/organizations" className="btn btn-ghost">
              View All Organizations
            </Link>
          </div>
          {topTeams.length === 0 ? (
            <p className="empty-state">
              Standings will appear here once the first season begins.
            </p>
          ) : (
            <div className="team-grid">
              {topTeams.map((team) => {
                const logo = logoByTeam.get(team.team.trim().toLowerCase());
                return (
                  <div className="team-card" key={team.team}>
                    <div className="team-rank">RCML · #{team.pos}</div>
                    <div className="team-badge">
                      {logo ? (
                        <img
                          src={logo}
                          alt={`${team.team} logo`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        team.tag || team.team.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <h3>{team.team}</h3>
                    <div className="team-meta">
                      <span>
                        W{team.wins}–L{team.losses}
                      </span>
                      <span>{team.pct}</span>
                    </div>
                    <div className="win-bar">
                      <span style={{ width: team.pct }}></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FEATURED NEWS */}
      <section>
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">Featured News</span>
              <h2>From the newsroom</h2>
            </div>
            <Link href="/news" className="btn btn-ghost">
              View All News
            </Link>
          </div>
          {featured.length === 0 ? (
            <p className="empty-state">
              No stories yet. League updates and match recaps will appear here.
            </p>
          ) : null}
          <div className="news-grid">
            {featured.map((post) => (
              <div key={post.id} className="news-card">
                <div className="news-thumb">
                  <span className="eyebrow">{post.category}</span>
                </div>
                <div className="news-body">
                  <span className="eyebrow">News</span>
                  <h3>{post.title}</h3>
                  <p>{excerpt(post.body)}</p>
                  <div className="news-foot">
                    <span>{fmtDate(post.created_at)}</span>
                    <Link href={`/news/${post.id}`}>Read More →</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEAGUE · CHAMPIONS */}
      <section>
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">League · Champions</span>
              <h2>Honoring the champions</h2>
            </div>
            <p className="lede">
              Honoring the champions who have risen, dominated, and left their
              mark in R3IGN HQ.
            </p>
          </div>
          <div className="champions-rail">
            {seasonCards.map((card) => {
              const copy = championCopy(card);
              return (
                <div
                  className="champion-card"
                  key={`${card.league}-${card.name ?? "first"}`}
                >
                  <div className="season">
                    {card.league} · {card.name ?? "First season"}
                  </div>
                  <div className="title">Champion</div>
                  <h3>{copy.name}</h3>
                  {copy.note ? <div className="date">{copy.note}</div> : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MORE FROM R3IGN */}
      <section className="section-tight">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">More From R3IGN</span>
              <h2>Explore the ecosystem</h2>
            </div>
          </div>
          <div className="dossier-grid">
            <div className="dossier">
              <div className="dossier-head">
                <span>Divisions</span>
              </div>
              <div className="dossier-body">
                <h3>Six-division ladder</h3>
                <p>Promotion &amp; relegation across every RCML tier.</p>
              </div>
              <div className="dossier-foot">
                <span>&nbsp;</span>
                <Link href="/divisions">View Ladder →</Link>
              </div>
            </div>
            <div className="dossier">
              <div className="dossier-head">
                <span>Player Market</span>
              </div>
              <div className="dossier-body">
                <h3>Find a roster spot</h3>
                <p>Browse free agents or list yourself as available.</p>
              </div>
              <div className="dossier-foot">
                <span>&nbsp;</span>
                <Link href="/player-market">Browse Market →</Link>
              </div>
            </div>
            <div className="dossier">
              <div className="dossier-head">
                <span>Awards</span>
              </div>
              <div className="dossier-body">
                <h3>Hall of Champions</h3>
                <p>Season MVPs and annual recognition.</p>
              </div>
              <div className="dossier-foot">
                <span>&nbsp;</span>
                <Link href="/awards">View Awards →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="section-tight">
        <div className="wrap" style={{ maxWidth: 560, textAlign: "center" }}>
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            Stay in the loop
          </span>
          <h2 style={{ marginTop: "0.75rem" }}>
            League updates &amp; registration windows
          </h2>
          <p className="lede">
            Get notified when RFCL / RBSL registration opens and when major
            RCML announcements drop.
          </p>

          <NewsletterForm />
          <p className="field-hint" style={{ marginTop: "0.75rem" }}>
            No spam. We only email about R3IGN league news. See our{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </section>

      {/* CTA BAND */}
      <div className="cta-band">
        <div className="wrap">
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            Enlist Your Roster
          </span>
          <h2 className="mt-lg" style={{ marginTop: "1rem" }}>
            Ready to compete?
          </h2>
          <p>
            Register your team, get placed into a league, and start climbing
            the R3IGN HQ rankings.
          </p>
          <div className="cta-actions">
            <Link href="/register" className="btn btn-primary">
              Register Your Team
            </Link>
            <Link href="/support" className="btn btn-ghost">
              Talk To Support
            </Link>
          </div>
        </div>
      </div>
      </main>
      <Footer />
    </>
  );
}
