import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import { SITE } from "@/lib/site";

/**
 * League rules. Add your real rules here, one section per heading, and the
 * page lists them and becomes visible to search engines automatically.
 * Until then it shows a "coming soon" notice and is kept out of search.
 *
 * Example:
 *   { heading: "Roster rules", items: ["Teams field five players.", "..."] }
 */
const RULES: { heading: string; items: string[] }[] = [];

const hasRules = RULES.length > 0;

export const metadata: Metadata = {
  title: "League Rules",
  description:
    "The competition rules that apply to every team and player in R3IGN HQ leagues.",
  robots: hasRules ? undefined : { index: false, follow: false },
};

export default function RulesPage() {
  return (
    <>
      <main id="main-content">
        <div className="page-header">
          <div className="wrap">
            <span className="breadcrumb">
              <Link href="/">Home</Link> / Rules
            </span>
            <span
              className="eyebrow"
              style={{ marginTop: "1rem", display: "inline-flex" }}
            >
              Fair Play
            </span>
            <h1>League Rules</h1>
            <p>
              The competition rules that apply to every team and player in
              R3IGN HQ leagues.
            </p>
          </div>
        </div>

        <section>
          <div className="wrap" style={{ maxWidth: "70ch" }}>
            {hasRules ? (
              RULES.map((section) => (
                <div key={section.heading} style={{ marginBottom: "2rem" }}>
                  <h2>{section.heading}</h2>
                  <ol style={{ marginTop: "0.75rem", paddingLeft: "1.25rem" }}>
                    {section.items.map((item, i) => (
                      <li key={i} style={{ marginBottom: "0.5rem" }}>
                        {item}
                      </li>
                    ))}
                  </ol>
                </div>
              ))
            ) : (
              <div className="empty-state">
                The full league rules are coming soon. Questions about rules
                or disputes in the meantime? Email{" "}
                <a
                  href={`mailto:${SITE.contactEmail}`}
                  style={{ color: "var(--paper)" }}
                >
                  {SITE.contactEmail}
                </a>
                .
              </div>
            )}
            <p style={{ marginTop: "2rem" }}>
              <Link href="/guide" className="btn btn-ghost">
                ← Back to Guide
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
