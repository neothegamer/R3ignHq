/**
 * Shows a photo only when an image URL exists. With no URL it renders nothing,
 * so pages never show a broken image or an empty grey box.
 */
type Props = {
  src?: string | null;
  alt: string;
  /** "round" for people (72px circle), "wide" for a story photo. */
  variant?: "round" | "wide";
};

export default function ImageFrame({ src, alt, variant = "wide" }: Props) {
  const url = (src ?? "").trim();
  if (!url) return null;

  if (variant === "round") {
    return (
      <img
        src={url}
        alt={alt}
        loading="lazy"
        style={{
          width: 72,
          height: 72,
          objectFit: "cover",
          borderRadius: "50%",
          marginBottom: "0.75rem",
        }}
      />
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      style={{
        display: "block",
        width: "100%",
        maxWidth: "70ch",
        height: "auto",
        maxHeight: 420,
        objectFit: "cover",
        border: "1px solid var(--line)",
        marginBottom: "1.5rem",
      }}
    />
  );
}
