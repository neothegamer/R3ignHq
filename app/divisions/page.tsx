import Link from "next/link";
import { countByDivision, getOrganizations } from "@/lib/teams";

export const metadata = {
  title: "Divisions",
  description:
    "The R3IGN six-division ladder with promotion and relegation, from Entry to the Pro League.",
  openGraph: {
    title: "Divisions · R3IGN HQ",
    description:
      "The R3IGN six-division ladder with promotion and relegation, from Entry to the Pro League.",
    type: "website",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
  twitter: {
    card: "summary",
    title: "Divisions · R3IGN HQ",
    description:
      "The R3IGN six-division ladder with promotion and relegation, from Entry to the Pro League.",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
};

const DIVISIONS = [
  {
    tier: "D1",
    name: "Pro League",
    description:
      "The top tier — the strongest organizations in R3IGN HQ compete for the season championship.",
    division: 1,
    id: "ladder-count-d1",
  },
  {
    tier: "D2",
    name: "Challengers",
    description:
      "Rising rosters pushing for a promotion spot into the Pro League.",
    division: 2,
    id: "ladder-count-d2",
  },
  {
    tier: "D3",
    name: "Contenders",
    description:
      "Established organizations building their case for the top tiers.",
    division: 3,
    id: "ladder-count-d3",
  },
  {
    tier: "D4",
    name: "Open",
    description:
      "Accessible competitive play for organizations proving themselves.",
    division: 4,
    id: "ladder-count-d4",
  },
  {
    tier: "D5",
    name: "Development",
    description:
      "A development tier focused on growing tomorrow's R3IGN rosters.",
    division: 5,
    id: "ladder-count-d5",
  },
  {
    tier: "D6",
    name: "Entry",
    description:
      "Every organization starts here — the first step onto the R3IGN HQ ladder.",
    division: 6,
    id: "ladder-count-d6",
  },
];

export default async function DivisionsPage() {
  const orgs = await getOrganizations();
  const counts = countByDivision(orgs, "rcml");

  return (
    <main id="main-content">
      <div className="page-header">
        <div className="wrap">
          <span className="breadcrumb">
            <Link href="/">Home</Link> / Divisions
          </span>
          <span
            className="eyebrow"
            style={{ marginTop: "1rem", display: "inline-flex" }}
          >
            RCML Ladder
          </span>
          <h1>Six Divisions. One Ladder.</h1>
          <p>
            RCML runs on a six-division promotion &amp; relegation system. Every
            organization starts at Entry and climbs toward the Pro League across
            each competitive series.
          </p>
        </div>
      </div>

      <section className="section-tight">
        <div className="wrap">
          <div className="stat-strip">
            <div className="stat">
              <div className="num">2</div>
              <div className="lbl">Series / Year</div>
            </div>
            <div className="stat">
              <div className="num">3</div>
              <div className="lbl">Phases / Series</div>
            </div>
            <div className="stat">
              <div className="num">6</div>
              <div className="lbl">Divisions</div>
            </div>
            <div className="stat">
              <div className="num">P/R</div>
              <div className="lbl">Promotion &amp; Relegation</div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">Ladder</span>
              <h2>Climb from Entry to Pro</h2>
            </div>
          </div>
          <div className="ladder">
            {DIVISIONS.map((d) => (
              <div key={d.tier} className="ladder-row">
                <div className="ladder-tier">{d.tier}</div>
                <div className="ladder-name">
                  <h3>{d.name}</h3>
                  <p>{d.description}</p>
                </div>
                <div className="ladder-count" id={d.id}>
                  {counts[d.division] === 1
                    ? "1 org"
                    : `${counts[d.division]} orgs`}
                </div>
                {counts[d.division] > 0 ? (
                  <Link
                    href="/organizations"
                    className="btn btn-ghost ladder-cta"
                  >
                    View teams →
                  </Link>
                ) : (
                  <span
                    className="btn btn-ghost ladder-cta"
                    aria-disabled="true"
                    style={{ opacity: 0.45, pointerEvents: "none" }}
                  >
                    No teams yet
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="cta-band">
        <div className="wrap">
          <h2>Start at Division 6</h2>
          <p>
            Every R3IGN champion started at the entry level. Register your
            organization to be placed for the next series.
          </p>
          <div className="cta-actions">
            <Link href="/register" className="btn btn-primary">
              Register Your Organization
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
