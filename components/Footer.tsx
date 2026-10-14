import { Fragment } from "react";
import Link from "next/link";
import { FEATURES } from "@/lib/features";
import { getSocialLinks } from "@/lib/site";

export default function Footer() {
  const year = new Date().getFullYear();
  const socials = getSocialLinks();

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid footer-grid-wide">
          <div>
            <div className="footer-brand">R3IGN HQ™</div>
            <p>
              R3IGN HQ — structured mobile esports competition across leagues
              and divisions.
            </p>
          </div>

          <div className="footer-col">
            <h4>League</h4>
            <ul>
              <li><Link href="/leagues">League Overview</Link></li>
              <li><Link href="/divisions">Divisions</Link></li>
              <li><Link href="/rankings">Rankings</Link></li>
              {FEATURES.events ? (
                <li><Link href="/events">Upcoming Events</Link></li>
              ) : null}
              {FEATURES.brackets ? (
                <li><Link href="/brackets">Tournament Bracket</Link></li>
              ) : null}
              <li><Link href="/register">Register Organization</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Compete</h4>
            <ul>
              <li><Link href="/player-market">Player Market</Link></li>
              <li><Link href="/messages">Messages</Link></li>
              <li><Link href="/organizations">Organizations</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Discover</h4>
            <ul>
              <li><Link href="/awards">Awards & Hall of Champions</Link></li>
              <li><Link href="/news">News</Link></li>
              <li><Link href="/media">Media</Link></li>
              {FEATURES.highlights ? (
                <li><Link href="/match-highlights">Match Highlights</Link></li>
              ) : null}
              {FEATURES.merch ? <li><Link href="/merch">Merch</Link></li> : null}
              <li><Link href="/partnerships">Partnerships</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Help</h4>
            <ul>
              <li><Link href="/guide">Guide</Link></li>
              <li><Link href="/support">FAQ & Support</Link></li>
              <li><Link href="/about">About R3IGN HQ</Link></li>
              <li><Link href="/community">Community</Link></li>
            </ul>
          </div>
        </div>

        <hr className="rule" style={{ margin: "2.5rem 0" }} />

        <div className="footer-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><Link href="/terms">Terms & Conditions</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/copyright">Copyright Policy</Link></li>
            </ul>
          </div>
          {socials.length > 0 ? (
            <div className="footer-col">
              <h4>Community Channels</h4>
              <ul>
                <li>
                  {socials.map((link, i) => (
                    <Fragment key={link.key}>
                      {i > 0 ? " · " : null}
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        {link.label}
                      </a>
                    </Fragment>
                  ))}
                </li>
              </ul>
            </div>
          ) : null}
        </div>

        <div className="footer-bottom">
          <span>© {year} R3IGN HQ™. All rights reserved.</span>
          <span></span>
        </div>
      </div>
    </footer>
  );
}