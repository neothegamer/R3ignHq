import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FEATURES } from "@/lib/features";
import { getSocialLink } from "@/lib/site";
import EventsClient, { type EventItem } from "./EventsClient";

export const metadata = {
  title: "Events",
  description:
    "Upcoming R3IGN matches and events — add any date straight to your calendar.",
  openGraph: {
    title: "Events · R3IGN HQ",
    description:
      "Upcoming R3IGN matches and events — add any date straight to your calendar.",
    type: "website",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
  twitter: {
    card: "summary",
    title: "Events · R3IGN HQ",
    description:
      "Upcoming R3IGN matches and events — add any date straight to your calendar.",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
};

export default async function EventsPage() {
  if (!FEATURES.events) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, description, league, location, start_time, end_time, ended_at"
    )
    .order("start_time", { ascending: true });

  const events: EventItem[] = !error && data ? (data as EventItem[]) : [];
  const discord = getSocialLink("discord");

  return (
    <main id="main-content">
      <div className="page-header">
        <div className="wrap">
          <span className="breadcrumb">
            <Link href="/">Home</Link> / Events
          </span>
          <span
            className="eyebrow"
            style={{ marginTop: "1rem", display: "inline-flex" }}
          >
            Mark Your Calendar
          </span>
          <h1>Events</h1>
          <p>
            League matches and community events. Tap Add to Calendar to save any
            date straight to your phone or computer.
          </p>
          {FEATURES.brackets ? (
            <div className="cta-actions" style={{ marginTop: "1.25rem" }}>
              <Link href="/brackets" className="btn btn-primary">
                View Tournament Bracket →
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <section className="section-tight">
        <div className="wrap">
          {events.length === 0 ? (
            <div className="empty-state">
              <h2 style={{ marginBottom: "0.5rem" }}>No upcoming events</h2>
              <p>
                Nothing is scheduled right now. New league matches and
                community events will appear here as soon as they are announced.
              </p>
              <div className="cta-actions" style={{ marginTop: "1.25rem" }}>
                <Link href="/leagues" className="btn btn-ghost">
                  View Leagues
                </Link>
                {discord ? (
                  <a
                    href={discord.url}
                    className="btn btn-ghost"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Follow on Discord
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            <EventsClient events={events} />
          )}
        </div>
      </section>
    </main>
  );
}
