import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import MessagesClient from "./MessagesClient";

export const metadata: Metadata = {
  title: "Messages",
  description: "Connect with players and organizations through your R3IGN inbox.",
  robots: { index: false },
  openGraph: {
    title: "Messages · R3IGN HQ",
    description: "Your competitive connections, all in one place. Message players and organizations on R3IGN HQ.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Messages · R3IGN HQ",
    description: "Stay connected with the R3IGN esports community.",
  },
};

export default function MessagesPage() {
  return (
    <main id="main-content">
      <div className="page-header">
        <div className="wrap">
          <span className="breadcrumb">
            <Link href="/">Home</Link> / Messages
          </span>
          <span className="eyebrow" style={{ marginTop: "1rem", display: "inline-flex" }}>
            Direct Messages
          </span>
          <h1>Messages</h1>
          <p>
            Chat directly with players and organizations you&apos;ve connected
            with through the Player Market.
          </p>
          <Link className="btn btn-primary r3ign-new-message" href="/player-market" style={{ marginTop: "1.25rem", display: "inline-flex" }}>
            New message
          </Link>
        </div>
      </div>
      <section className="section-tight r3ign-messages">
        <div className="wrap r3ign-messages-wrap">
          <Suspense fallback={<div className="r3ign-messages-loading" role="status">Loading your inbox…</div>}>
            <MessagesClient />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
