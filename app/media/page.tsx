import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { getPressEmail } from "@/lib/site";

export const metadata = {
  title: "Media",
  description:
    "Brand assets, match highlights, and press resources for R3IGN HQ.",
  openGraph: {
    title: "Media · R3IGN HQ",
    description:
      "Brand assets, match highlights, and press resources for R3IGN HQ.",
    type: "website",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
  twitter: {
    card: "summary",
    title: "Media · R3IGN HQ",
    description:
      "Brand assets, match highlights, and press resources for R3IGN HQ.",
    images: ["/assets/r3ign-logo-256.jpg"],
  },
};

type BrandFile = { name: string; ext: string; size: string };

const BRAND_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".webp",
  ".pdf",
  ".zip",
]);

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Logo and brand files in public/brand. No folder or no files = empty list. */
async function loadBrandFiles(): Promise<BrandFile[]> {
  const dir = path.join(process.cwd(), "public", "brand");
  try {
    const names = await readdir(dir);
    const files: BrandFile[] = [];
    for (const name of names.sort((a, b) => a.localeCompare(b))) {
      const ext = path.extname(name).toLowerCase();
      if (name.startsWith(".") || !BRAND_EXTENSIONS.has(ext)) continue;
      const info = await stat(path.join(dir, name));
      if (!info.isFile()) continue;
      files.push({
        name,
        ext: ext.slice(1).toUpperCase(),
        size: formatSize(info.size),
      });
    }
    return files;
  } catch {
    return [];
  }
}

export default async function MediaPage() {
  const brandFiles = await loadBrandFiles();
  const pressEmail = getPressEmail();

  return (
    <main id="main-content">
      <div className="page-header">
        <div className="wrap">
          <span className="breadcrumb">
            <Link href="/">Home</Link> / Media
          </span>
          <span
            className="eyebrow"
            style={{ marginTop: "1rem", display: "inline-flex" }}
          >
            Press &amp; Brand
          </span>
          <h1>Media</h1>
          <p>
            Brand assets, match highlights, and press resources for creators
            and outlets covering R3IGN.
          </p>
        </div>
      </div>

      <section>
        <div className="wrap">
          <div className="pillars">
            <div className="pillar">
              <div className="num">01</div>
              <h3>Brand Assets</h3>
              <p>
                Logos for creators and partners referencing R3IGN in their own
                content. Download them in the Brand Kit below.
              </p>
            </div>
            <div className="pillar">
              <div className="num">02</div>
              <h3>Match Highlights</h3>
              <p>
                Clips and recaps from league matches, published after each
                event.
              </p>
            </div>
            <div className="pillar">
              <div className="num">03</div>
              <h3>Press Contact</h3>
              <p>
                Reach out for interviews, credentials, or coverage requests.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="brand-kit">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">Brand Kit</span>
              <h2>Logos &amp; brand files</h2>
            </div>
          </div>
          {brandFiles.length === 0 ? (
            <p className="empty-state">
              Brand kit coming soon. Need a logo in the meantime? Email{" "}
              <a href={`mailto:${pressEmail}`} style={{ color: "var(--paper)" }}>
                {pressEmail}
              </a>
              .
            </p>
          ) : (
            <div className="value-list">
              {brandFiles.map((file, i) => (
                <div className="value-row" key={file.name}>
                  <div className="idx">{String(i + 1).padStart(2, "0")}</div>
                  <div>
                    <h3>{file.name}</h3>
                    <p>
                      {file.ext} · {file.size}
                    </p>
                    <a
                      className="btn btn-ghost"
                      href={`/brand/${encodeURIComponent(file.name)}`}
                      download
                      style={{ marginTop: "0.75rem" }}
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="press-contact">
        <div className="wrap">
          <div className="contact-card" style={{ maxWidth: "36rem" }}>
            <span className="eyebrow">Press Contact</span>
            <p>
              Interviews, credentials and coverage requests go to our media
              team.
            </p>
            <a className="link" href={`mailto:${pressEmail}`}>
              {pressEmail}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
