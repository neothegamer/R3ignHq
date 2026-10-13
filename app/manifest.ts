import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "R3IGN HQ",
    short_name: "R3IGN HQ",
    description:
      "Competitive mobile esports ecosystem — structured leagues, rankings, tournaments, and player market for COD: Mobile, Free Fire, and Blood Strike.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0C0B",
    theme_color: "#0A0C0B",
    orientation: "any",
    categories: ["games", "sports", "entertainment"],
    icons: [
      {
        src: "/assets/r3ign-logo-256.jpg",
        sizes: "256x256",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/assets/favicon.png",
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
