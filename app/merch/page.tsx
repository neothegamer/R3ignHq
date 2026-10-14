import type { Metadata } from "next";
import Link from "next/link";
import { FEATURES } from "@/lib/features";
import MerchSignup from "./MerchSignup";

export const metadata: Metadata = {
  title: "Merch",
  description: "Official R3IGN merchandise — coming soon.",
  // While merch is switched off in lib/features.ts, keep the page out of search.
  robots: FEATURES.merch ? undefined : { index: false, follow: false },
  openGraph: {
    title: "Merch · R3IGN HQ",
    description: "Official R3IGN merchandise — coming soon.",
    type: "website",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
  twitter: {
    card: "summary",
    title: "Merch · R3IGN HQ",
    description: "Official R3IGN merchandise — coming soon.",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
};

export default function MerchPage() {
  return (
    <main id="main-content">
      <div className="page-header">
        <div className="wrap">
          <span className="breadcrumb">
            <Link href="/">Home</Link> / Merch
          </span>
          <span
            className="eyebrow"
            style={{ marginTop: "1rem", display: "inline-flex" }}
          >
            Coming Soon
          </span>
          <h1>Merch</h1>
          <p>
            Official R3IGN gear is on the way. Leave your email and
            we&rsquo;ll let you know the moment the first drop is live.
          </p>
        </div>
      </div>

      <section>
        <div className="wrap center">
          <MerchSignup />
        </div>
      </section>
    </main>
  );
}
