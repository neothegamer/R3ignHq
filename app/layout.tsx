import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import NavAccount from "@/components/NavAccount";
import MobileSignOut from "@/components/MobileSignOut";
import Providers from "@/components/Providers";
import { createClient } from "@/lib/supabase/server";
import { FEATURES } from "@/lib/features";
import { getLeagueSeasons, toStatusItems } from "@/lib/season";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000")
  ),
  title: {
    default: "R3IGN HQ",
    template: "%s · R3IGN HQ",
  },
  description:
    "R3IGN HQ is a competitive mobile esports ecosystem running structured leagues, rankings, and tournaments for players, teams, and communities.",
  openGraph: {
    title: "R3IGN HQ",
    description:
      "R3IGN HQ is a competitive mobile esports ecosystem running structured leagues, rankings, and tournaments for players, teams, and communities.",
    type: "website",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
  twitter: {
    card: "summary",
    title: "R3IGN HQ",
    description:
      "R3IGN HQ is a competitive mobile esports ecosystem running structured leagues, rankings, and tournaments for players, teams, and communities.",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
  icons: {
    icon: "/assets/favicon.png",
  },
};

/** Total events on record. Zero (or unreadable) hides the Events nav item. */
async function countEvents(): Promise<number> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true });
    return error ? 0 : (count ?? 0);
  } catch {
    return 0;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [seasons, eventCount] = await Promise.all([
    getLeagueSeasons(),
    countEvents(),
  ]);

  const hiddenHrefs: string[] = [];
  if (!FEATURES.events || eventCount === 0) hiddenHrefs.push("/events");
  if (!FEATURES.brackets) hiddenHrefs.push("/brackets");
  if (!FEATURES.highlights) hiddenHrefs.push("/match-highlights");
  if (!FEATURES.merch) hiddenHrefs.push("/merch");

  return (
    <html lang="en">
      <body>
        <Providers>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <Header
            accountSlot={<NavAccount />}
            mobileAccountSlot={<NavAccount mobileMenu />}
            mobileSignOutSlot={<MobileSignOut />}
            statusItems={toStatusItems(seasons)}
            hiddenHrefs={hiddenHrefs}
          />
          {children}
        </Providers>
      </body>
    </html>
  );
}
