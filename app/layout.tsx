import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import NavAccount from "@/components/NavAccount";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <Header accountSlot={<NavAccount />} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
