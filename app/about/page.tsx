import Link from "next/link";
import Footer from "@/components/Footer";
import ImageFrame from "@/components/ImageFrame";
import { ABOUT } from "@/lib/about";

export const metadata = {
  title: "About",
  description:
    "The story, the people and the mission behind R3IGN HQ, a competitive mobile esports organization.",
  openGraph: {
    title: "About · R3IGN HQ",
    description:
      "The story, the people and the mission behind R3IGN HQ, a competitive mobile esports organization.",
    type: "website",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
  twitter: {
    card: "summary",
    title: "About · R3IGN HQ",
    description:
      "The story, the people and the mission behind R3IGN HQ, a competitive mobile esports organization.",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
};

function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function AboutPage() {
  const story = paragraphs(ABOUT.story);
  const mission = paragraphs(ABOUT.mission);

  return (
    <>
      <main id="main-content">
        <div className="page-header">
          <div className="wrap">
            <span className="breadcrumb">
              <Link href="/">Home</Link> / About
            </span>
            <span
              className="eyebrow"
              style={{ marginTop: "1rem", display: "inline-flex" }}
            >
              About Us
            </span>
            <h1>About R3IGN HQ</h1>
            <p>
              The story, the people and the purpose behind the league.
              {ABOUT.yearStarted ? ` Running since ${ABOUT.yearStarted}.` : ""}
            </p>
          </div>
        </div>

        {/* OUR STORY */}
        <section>
          <div className="wrap">
            <div className="section-head">
              <div>
                <span className="eyebrow">Our Story</span>
                <h2>How R3IGN HQ started</h2>
              </div>
            </div>
            <ImageFrame src={ABOUT.storyPhotoUrl} alt="R3IGN HQ" variant="wide" />
            {story.length > 0 ? (
              story.map((p, i) => (
                <p
                  key={i}
                  style={{ maxWidth: "70ch", marginBottom: "1.25rem" }}
                >
                  {p}
                </p>
              ))
            ) : (
              <p className="empty-state">
                Our story is coming soon. Check back shortly.
              </p>
            )}
          </div>
        </section>

        {/* THE TEAM / FOUNDER */}
        <section>
          <div className="wrap">
            <div className="section-head">
              <div>
                <span className="eyebrow">The Team</span>
                <h2>The people behind R3IGN HQ</h2>
              </div>
            </div>
            {ABOUT.founders.length > 0 ? (
              <div className="value-list">
                {ABOUT.founders.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="value-row">
                    <div className="idx">{String(i + 1).padStart(2, "0")}</div>
                    <div>
                      <ImageFrame
                        src={f.photoUrl}
                        alt={f.name}
                        variant="round"
                      />
                      <h3>{f.name}</h3>
                      <p>
                        {f.role}
                        {f.bio ? ` — ${f.bio}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">
                Meet the team: profiles are coming soon.
              </p>
            )}
          </div>
        </section>

        {/* OUR MISSION */}
        <section>
          <div className="wrap">
            <div className="section-head">
              <div>
                <span className="eyebrow">Our Mission</span>
                <h2>What we are here to do</h2>
              </div>
            </div>
            {mission.length > 0 ? (
              mission.map((p, i) => (
                <p
                  key={i}
                  style={{ maxWidth: "70ch", marginBottom: "1.25rem" }}
                >
                  {p}
                </p>
              ))
            ) : (
              <p className="empty-state">
                Our mission statement will be published here soon.
              </p>
            )}
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
              <Link href="/register" className="btn btn-primary">
                Register Your Team
              </Link>
              <Link href="/support" className="btn btn-ghost">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
