import type { Metadata } from "next";
import Link from "next/link";

/** Keeps signed-in-only pages out of search results. */
export const signedInOnlyRobots: Metadata["robots"] = {
  index: false,
  follow: false,
};

type Props = {
  eyebrow: string;
  title: string;
  /** One or two sentences: what this page is. */
  what: string;
  /** One sentence: why signing in is needed. */
  why: string;
  /** Where the visitor should land after signing in. */
  redirectTo?: string;
};

/**
 * Shown on pages that need an account, to visitors who are signed out. It
 * explains the page before offering the sign-in button.
 */
export default function SignedOutNotice({
  eyebrow,
  title,
  what,
  why,
  redirectTo,
}: Props) {
  const query = redirectTo
    ? `?redirect=${encodeURIComponent(redirectTo)}`
    : "";

  return (
    <main id="main-content">
      <section className="section-tight">
        <div className="wrap auth-wrap">
          <div className="auth-panel">
            <span className="eyebrow">{eyebrow}</span>
            <h1 style={{ marginTop: "0.75rem" }}>{title}</h1>
            <p className="lede">{what}</p>
            <p className="field-hint" style={{ marginBottom: "1.5rem" }}>
              {why}
            </p>
            <div className="cta-actions">
              <Link href={`/signin${query}`} className="btn btn-primary">
                Sign In
              </Link>
              <Link href="/signup" className="btn btn-ghost">
                Create an Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
