/**
 * Content for the About page. Fill these in with your real story, team and
 * mission. Nothing here is invented: any field left empty shows a quiet
 * "coming soon" line on the page instead.
 */

export type Founder = {
  name: string;
  role: string;
  bio?: string;
  /** Path under /public (for example "/assets/team/daniel.jpg") or a full URL. */
  photoUrl?: string;
};

export const ABOUT: {
  /** The year R3IGN HQ started, for example 2024. Leave null to hide it. */
  yearStarted: number | null;
  /** Our story. Separate paragraphs with a blank line. */
  story: string;
  /** Optional photo shown beside the story. Hidden while empty. */
  storyPhotoUrl: string;
  founders: Founder[];
  /** Our mission, in your own words. Separate paragraphs with a blank line. */
  mission: string;
} = {
  yearStarted: null,
  story: "",
  storyPhotoUrl: "",
  founders: [],
  mission: "",
};
