/**
 * Feature switches for the public site.
 *
 * Flip a flag to `true` when the section has real content and you want it
 * visible. A flag set to `false` hides the section from the navigation,
 * footer and sitemap.
 *
 * Note: events, brackets and highlights are also hidden automatically when
 * the database has nothing to show, so leaving them `true` is safe.
 */
export const FEATURES = {
  /**
   * R3IGN Bot chat widget. Off unless NEXT_PUBLIC_CHATBOT_ENABLED=true is set
   * (in .env.local and in the Vercel project settings).
   */
  chatbot: process.env.NEXT_PUBLIC_CHATBOT_ENABLED === "true",

  /** Merch "Coming soon" page in the navigation, footer and sitemap. */
  merch: false,

  /** Tournament brackets page. It shows "No active tournament" when empty. */
  brackets: true,

  /** Events page. The nav item also hides itself when there are zero events. */
  events: true,

  /** Match highlights page. Only clips that have a video are ever listed. */
  highlights: true,
} as const;

export type FeatureKey = keyof typeof FEATURES;
