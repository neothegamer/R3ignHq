"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // size of the file the user picks
const MAX_OUTPUT_SIZE = 2 * 1024 * 1024; // size after we resize + compress
const OUTPUT_PX = 512;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

export type PreparedLogo = {
  blob: Blob;
  extension: "webp" | "jpg";
  contentType: "image/webp" | "image/jpeg";
};

type Props = {
  disabled?: boolean;
  onChange: (logo: PreparedLogo | null) => void;
};

/** Fit the whole logo inside a square (no cropping) so nothing gets cut off. */
async function prepareLogo(file: File): Promise<PreparedLogo> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_PX;
    canvas.height = OUTPUT_PX;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare this image for upload.");

    const inner = OUTPUT_PX * 0.88; // leave a little breathing room
    const ratio = Math.min(inner / bitmap.width, inner / bitmap.height);
    const w = bitmap.width * ratio;
    const h = bitmap.height * ratio;
    const draw = () =>
      ctx.drawImage(bitmap, (OUTPUT_PX - w) / 2, (OUTPUT_PX - h) / 2, w, h);

    const encode = (type: "image/webp" | "image/jpeg", quality: number) =>
      new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, type, quality)
      );

    draw(); // transparent background, WebP keeps the transparency
    for (const quality of [0.9, 0.75, 0.6]) {
      const blob = await encode("image/webp", quality);
      if (!blob) break;
      if (blob.type !== "image/webp") break; // browser can't encode WebP
      if (blob.size <= 500 * 1024 || quality === 0.6) {
        return { blob, extension: "webp", contentType: "image/webp" };
      }
    }

    // JPEG fallback has no transparency, so paint a dark background first.
    ctx.clearRect(0, 0, OUTPUT_PX, OUTPUT_PX);
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, OUTPUT_PX, OUTPUT_PX);
    draw();
    const blob = await encode("image/jpeg", 0.85);
    if (!blob || blob.type !== "image/jpeg") {
      throw new Error("Could not encode this image.");
    }
    return { blob, extension: "jpg", contentType: "image/jpeg" };
  } finally {
    bitmap.close();
  }
}

export default function TeamLogoUploader({ disabled, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  async function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError("Unsupported image type. Choose a PNG, JPEG, or WebP file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Logo is too large. Choose a file no bigger than 5 MB.");
      return;
    }

    setBusy(true);
    try {
      const prepared = await prepareLogo(file);
      if (prepared.blob.size > MAX_OUTPUT_SIZE) {
        throw new Error("Logo is still too large after resizing. Try a simpler image.");
      }
      setPreviewUrl(URL.createObjectURL(prepared.blob));
      setFileName(file.name);
      onChange(prepared);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not read this image. Try another file."
      );
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    setPreviewUrl(null);
    setFileName("");
    setError(null);
    onChange(null);
  }

  return (
    <div className="field">
      <span className="field-label" id="team-logo-label">
        Team logo
      </span>
      <div className="logo-upload">
        <button
          type="button"
          className={`logo-upload-preview${previewUrl ? " has-logo" : ""}`}
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy}
          aria-labelledby="team-logo-label"
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Team logo preview" />
          ) : busy ? (
            <span aria-hidden="true">…</span>
          ) : null}
        </button>
        <div className="logo-upload-body">
          <div className="logo-upload-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || busy}
            >
              {previewUrl ? "Change logo" : "Upload logo"}
            </button>
            {previewUrl && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={remove}
                disabled={disabled || busy}
              >
                Remove
              </button>
            )}
          </div>
          <p className="field-hint">
            {previewUrl
              ? fileName
              : "Optional. PNG, JPEG or WebP, up to 5 MB. A square logo on a transparent background works best."}
          </p>
        </div>
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          accept={ACCEPTED.join(",")}
          aria-label="Choose a team logo"
          onChange={handleSelect}
          disabled={disabled || busy}
        />
      </div>
      {error && (
        <p className="logo-upload-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
