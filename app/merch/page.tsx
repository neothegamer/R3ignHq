import Link from "next/link";

export const metadata = {
  title: "Merch",
  description: "Official R3IGN merchandise — coming soon.",
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
            Official R3IGN gear is on the way. Join the newsletter and
            we&rsquo;ll let you know the moment the first drop is live.
          </p>
        </div>
      </div>

      <section>
        <div className="wrap center">
          <Link href="/#newsletter-form" className="btn btn-primary">
            Get Notified
          </Link>
        </div>
      </section>
    </main>
  );
}
