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
    <main id="main-content" className="r3ign-messages">
      <div className="r3ign-messages-wrap">
        <nav className="r3ign-messages-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">›</span><span>Messages</span></nav>
        <div className="r3ign-messages-title-row">
          <div><h1>MESSAGES<span>.</span></h1><p>Your next teammate. Your next match. It starts here.</p></div>
          <Link className="btn btn-primary r3ign-new-message" href="/player-market"><span aria-hidden="true">↗</span> New message</Link>
        </div>
        <Suspense fallback={<div className="r3ign-messages-loading" role="status">Loading your inbox…</div>}><MessagesClient /></Suspense>
      </div>
    </main>
  );
}
