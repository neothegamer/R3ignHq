import { getSocialLinks, type SocialLink } from "@/lib/site";

export const metadata = {
  title: "Community",
  description:
    "Join R3IGN HQ's community channels for match updates and league chat.",
};

const DESCRIPTIONS: Record<SocialLink["key"], string> = {
  discord: "Match updates, league chat, and support",
  instagram: "Highlights, graphics, and behind the scenes",
  tiktok: "Short-form highlights and clips",
  facebook: "League announcements and community updates",
};

export default function CommunityPage() {
  // Links come from lib/site.ts; any link left empty there is not shown.
  const links = getSocialLinks();

  return (
    <main id="main-content">
      <div className="page-header">
        <div className="wrap">
          <span className="breadcrumb">
            <a href="/">Home</a> / Community
          </span>
          <span className="eyebrow" style={{ marginTop: "1rem", display: "inline-flex" }}>
            Stay Connected
          </span>
          <h1>Community</h1>
          <p>
            Join R3IGN HQ&rsquo;s community channels for match updates, league
            chat, and direct access to support.
          </p>
        </div>
      </div>

      <section className="section-tight">
        <div className="wrap">
          {links.length === 0 ? (
            <p className="empty-state">
              Our community channels are coming soon.
            </p>
          ) : (
            <div className="social-grid">
              {links.map((link) => (
                <div className="social-card" key={link.key}>
                  <div>
                    <h3>{link.label}</h3>
                    <p>{DESCRIPTIONS[link.key]}</p>
                  </div>
                  <a
                    href={link.url}
                    className="btn btn-ghost"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
