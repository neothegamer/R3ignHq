import Footer from "@/components/Footer";
import { ABOUT } from "@/lib/about";
import { getSiteStats, statValue } from "@/lib/stats";

export const metadata = {
  title: "About",
  description:
    "R3IGN HQ is a competitive esports ecosystem built on professional league operations, fair competition, and accurate rankings.",
};

export default async function AboutPage() {
  const stats = await getSiteStats();

  return (
    <>
      <main id="main-content">
        <div className="page-header">
          <div className="wrap">
            <span className="breadcrumb">
              <a href="/">Home</a> / About
            </span>
            <span className="eyebrow" style={{ marginTop: "1rem", display: "inline-flex" }}>
              Who We Are
            </span>
            <h1>
              More than leagues.
              <br />
              We build legacies.
            </h1>
            <p>
              R3IGN HQ is a competitive esports ecosystem designed to provide
              professional league operations, rankings, tournaments, media
              exposure, and growth opportunities for players, teams,
              organizations, and gaming communities.
            </p>
          </div>
        </div>

        <section className="section-tight">
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
        </section>

        {ABOUT.story.trim() ? (
          <section>
            <div className="wrap">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Our Story</span>
                  <h2>How R3IGN HQ started</h2>
                </div>
              </div>
              {ABOUT.story
                .split(/\n{2,}/)
                .map((p) => p.trim())
                .filter(Boolean)
                .map((p, i) => (
                  <p
                    key={i}
                    style={{ maxWidth: "70ch", marginBottom: "1.25rem" }}
                  >
                    {p}
                  </p>
                ))}
            </div>
          </section>
        ) : null}

        {ABOUT.founders.length > 0 ? (
          <section>
            <div className="wrap">
              <div className="section-head">
                <div>
                  <span className="eyebrow">The Team</span>
                  <h2>The people behind R3IGN HQ</h2>
                </div>
              </div>
              <div className="value-list">
                {ABOUT.founders.map((f, i) => (
                  <div key={f.name} className="value-row">
                    <div className="idx">{String(i + 1).padStart(2, "0")}</div>
                    <div>
                      {f.photoUrl ? (
                        <img
                          src={f.photoUrl}
                          alt={f.name}
                          loading="lazy"
                          style={{
                            width: 72,
                            height: 72,
                            objectFit: "cover",
                            borderRadius: "50%",
                            marginBottom: "0.75rem",
                          }}
                        />
                      ) : null}
                      <h3>{f.name}</h3>
                      <p>
                        {f.role}
                        {f.bio ? ` — ${f.bio}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section>
          <div className="wrap">
            <div className="section-head">
              <div>
                <span className="eyebrow">Our Mission</span>
                <h2>A trusted competitive environment</h2>
              </div>
              <p className="lede">
                Our mission is to establish a trusted competitive environment
                where talent is discovered, competition thrives, and champions
                are crowned.
              </p>
            </div>
            <div className="value-list">
              <div className="value-row">
                <div className="idx">01</div>
                <div>
                  <h3>Community</h3>
                  <p>
                    Join a growing network of players, teams, and competitive
                    communities.
                  </p>
                </div>
              </div>
              <div className="value-row">
                <div className="idx">02</div>
                <div>
                  <h3>Fair Competition</h3>
                  <p>
                    Clear rules, transparent administration, and unbiased
                    decision-making in every league we run.
                  </p>
                </div>
              </div>
              <div className="value-row">
                <div className="idx">03</div>
                <div>
                  <h3>Rankings</h3>
                  <p>
                    Track team and player performance with accurate, up-to-date
                    competitive rankings.
                  </p>
                </div>
              </div>
              <div className="value-row">
                <div className="idx">04</div>
                <div>
                  <h3>Growth</h3>
                  <p>
                    Media exposure and structured seasons give players and orgs
                    a real path to grow their name.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="cta-band">
          <div className="wrap">
            <h2>Join the ecosystem</h2>
            <p>
              Whether you&rsquo;re a player, a team captain, or an organization,
              there&rsquo;s a place for you in R3IGN HQ.
            </p>
            <div className="cta-actions">
              <a href="/register" className="btn btn-primary">
                Register Your Team
              </a>
              <a href="/support" className="btn btn-ghost">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
