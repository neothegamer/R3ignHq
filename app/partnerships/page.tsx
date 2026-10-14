import { getAudienceStats } from "@/lib/audience";
import PartnershipForm from "./PartnershipForm";

export const metadata = {
  title: "Partnerships",
  description: "Sponsorship and partnership opportunities with R3IGN HQ.",
};

export default function PartnershipsPage() {
  // Only numbers filled in lib/audience.ts are shown.
  const audience = getAudienceStats();

  return (
    <main id="main-content">
      <div className="page-header">
        <div className="wrap">
          <span className="breadcrumb">
            <a href="/">Home</a> / Partnerships
          </span>
          <span
            className="eyebrow"
            style={{ marginTop: "1rem", display: "inline-flex" }}
          >
            Work With R3IGN
          </span>
          <h1>Partnerships</h1>
          <p>
            Connect your brand with a growing mobile esports audience across
            players, organizations, and community leaders.
          </p>
        </div>
      </div>

      {audience.length > 0 ? (
        <section className="section-tight">
          <div className="wrap">
            <div
              className="stat-strip"
              style={{ display: "flex", flexWrap: "wrap" }}
            >
              {audience.map((stat) => (
                <div
                  className="stat"
                  key={stat.key}
                  style={{ flex: "1 1 12rem" }}
                >
                  <div className="num">{stat.value.toLocaleString("en-US")}</div>
                  <div className="lbl">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section>
        <div className="wrap">
          <div className="dossier-grid">
            <div className="dossier">
              <div className="dossier-head">
                <span>Tier 01</span>
                <span className="stamp stamp-active">Event Partner</span>
              </div>
              <div className="dossier-body">
                <h3>League Sponsorship</h3>
                <p>
                  Branding across league seasons and marquee event broadcasts.
                </p>
              </div>
            </div>
            <div className="dossier">
              <div className="dossier-head">
                <span>Tier 02</span>
                <span className="stamp stamp-active">Media Partner</span>
              </div>
              <div className="dossier-body">
                <h3>Content &amp; Broadcast</h3>
                <p>
                  Co-branded highlights, recaps, and creator collaborations.
                </p>
              </div>
            </div>
            <div className="dossier">
              <div className="dossier-head">
                <span>Tier 03</span>
                <span className="stamp stamp-active">Community Partner</span>
              </div>
              <div className="dossier-body">
                <h3>Community Programs</h3>
                <p>
                  Giveaways, Discord activations, and player-facing campaigns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact">
        <div className="wrap" style={{ maxWidth: "44rem" }}>
          <div className="section-head">
            <div>
              <span className="eyebrow">Get In Touch</span>
              <h2>Discuss a partnership</h2>
            </div>
          </div>
          <div className="form-panel">
            <PartnershipForm />
          </div>
        </div>
      </section>
    </main>
  );
}