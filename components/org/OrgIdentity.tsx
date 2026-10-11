/**
 * OrgIdentity — large avatar + bold org tag + region, shown side by side.
 *
 * Mirrors the player profile hero (`.public-profile-avatar`): same size
 * (via --hero-avatar-size) and same gold border. Data-driven, so it works for
 * every org, existing or newly added. Nothing here is hardcoded per org.
 *
 * - logoUrl missing  -> the tag is shown inside the circle as a fallback
 * - region missing   -> "Region not set"
 * - tag 2-5+ chars   -> font size scales down with length so it never overflows
 */
type Props = {
  tag: string;
  region?: string | null;
  logoUrl?: string | null;
  className?: string;
};

function tagScale(length: number) {
  if (length <= 2) return 1;
  if (length === 3) return 0.85;
  if (length === 4) return 0.7;
  return 0.58;
}

export default function OrgIdentity({
  tag,
  region,
  logoUrl,
  className = "",
}: Props) {
  const cleanTag = (tag || "").trim();
  const displayTag = cleanTag || "—";
  const scale = tagScale(cleanTag.length);

  return (
    <div className={`org-identity ${className}`.trim()}>
      <div className="org-identity-avatar" id="org-badge">
        {logoUrl ? (
          <img src={logoUrl} alt="" />
        ) : (
          <span aria-hidden="true">{cleanTag || "?"}</span>
        )}
      </div>
      <div
        className="org-identity-text"
        style={{ ["--tag-scale" as string]: scale }}
      >
        <h2 className="org-identity-tag" id="org-tag-full">
          {displayTag}
        </h2>
        <p className="org-identity-region" id="org-region">
          {region?.trim() || "Region not set"}
        </p>
      </div>
    </div>
  );
}
