import type { Metadata } from "next";
import Link from "next/link";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Register Your Team",
  description: "Submit your roster for placement in an R3IGN mobile esports league.",
  openGraph: {
    title: "Register Your Team · R3IGN HQ",
    description: "Submit your roster for placement in an R3IGN mobile esports league.",
    type: "website",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
  twitter: {
    card: "summary",
    title: "Register Your Team · R3IGN HQ",
    description: "Submit your roster for placement in an R3IGN mobile esports league.",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
};

export default function RegisterPage() {
  return (
    <main id="main-content">
      <section className="section-tight">
        <div className="wrap auth-wrap register-wrap">
          <div className="auth-panel">
            <span className="eyebrow">Team Registration</span>
            <h1 style={{ marginTop: "0.75rem" }}>Register Your Team</h1>
            <p className="lede">
              Submit your roster for placement in an R3IGN mobile esports league. A staff member will review and follow up.
            </p>

            <div className="form-panel" style={{ margin: "1.5rem 0" }}>
              <span className="eyebrow">What you&rsquo;ll need</span>
              <ul style={{ marginTop: "0.75rem", paddingLeft: "1.25rem" }}>
                <li>A team name and a short team tag (up to 5 characters)</li>
                <li>The league you want to enter: RCML, RFCL or RBSL</li>
                <li>A captain&rsquo;s name and email address</li>
                <li>Your region</li>
                <li>Your roster, listed by in-game name, one per line</li>
                <li>
                  Optional: a team logo, a Discord handle and notes about your
                  team
                </li>
                <li>
                  Confirmation that your roster agrees to the{" "}
                  <Link href="/rules" style={{ color: "var(--paper)" }}>
                    league rules
                  </Link>{" "}
                  and code of conduct
                </li>
              </ul>
              <p className="field-hint" style={{ marginTop: "0.75rem" }}>
                You also need a free player account, so your team stays linked
                to you and staff can follow up. Sign in or create one below.
              </p>
            </div>

            <RegisterForm />
          </div>
        </div>
      </section>
    </main>
  );
}
