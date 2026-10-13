/**
 * Audience numbers for the Partnerships page.
 *
 * Fill in only numbers you can stand behind. Anything left as `null` is not
 * shown, and if every value is `null` the whole stats block is hidden.
 */
export type AudienceStat = {
  key: "players" | "discord" | "followers" | "views";
  label: string;
  value: number | null;
};

export const AUDIENCE: AudienceStat[] = [
  { key: "players", label: "Players", value: null },
  { key: "discord", label: "Discord members", value: null },
  { key: "followers", label: "Social followers", value: null },
  { key: "views", label: "Total views", value: null },
];

/** The stats that have a real number filled in. */
export function getAudienceStats(): (AudienceStat & { value: number })[] {
  return AUDIENCE.filter(
    (stat): stat is AudienceStat & { value: number } =>
      typeof stat.value === "number" && stat.value > 0
  );
}
