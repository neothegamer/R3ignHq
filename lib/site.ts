/**
 * Site-wide contact details and social links. Edit them here and every page
 * (footer, community, support, legal pages, media) updates together.
 */
export const SITE = {
  name: "R3IGN HQ",
  /** Shown on Support, Privacy, Terms and Copyright. */
  contactEmail: "r3ignhq@gmail.com",
  /**
   * Press / media enquiries. Leave empty to use the contact email above.
   */
  pressEmail: "",
};

export type SocialLink = {
  key: "discord" | "instagram" | "tiktok" | "facebook";
  label: string;
  /** Full https:// address. Leave empty to hide the link everywhere. */
  url: string;
};

export const SOCIAL_LINKS: SocialLink[] = [
  { key: "discord", label: "Discord", url: "https://discord.gg/85qGDxyCdp" },
  {
    key: "instagram",
    label: "Instagram",
    url: "https://www.instagram.com/r3ignhq",
  },
  { key: "tiktok", label: "TikTok", url: "https://www.tiktok.com/@r3ignhq" },
  {
    key: "facebook",
    label: "Facebook",
    url: "https://www.facebook.com/share/18zfJRxAJK/",
  },
];

/** Only links that are a real https address; empty or "#" links never render. */
export function getSocialLinks(): SocialLink[] {
  return SOCIAL_LINKS.filter((link) => /^https:\/\/\S+$/.test(link.url.trim()));
}

export function getSocialLink(key: SocialLink["key"]): SocialLink | undefined {
  return getSocialLinks().find((link) => link.key === key);
}

export function getPressEmail(): string {
  return SITE.pressEmail.trim() || SITE.contactEmail;
}
