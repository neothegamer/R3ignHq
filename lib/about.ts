/**
 * Content for the About page. Fill these in with your real story and team.
 * Any section left empty is simply not shown, so nothing here is invented.
 */

export type Founder = {
  name: string;
  role: string;
  bio?: string;
  /** Path under /public (for example "/assets/team/daniel.jpg") or a full URL. */
  photoUrl?: string;
};

export const ABOUT: {
  story: string;
  founders: Founder[];
} = {
  story: "",
  founders: [],
};
