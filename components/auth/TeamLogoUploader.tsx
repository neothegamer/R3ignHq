"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

/**
 * Team logo picker for /register.
 *
 * Looks and behaves like the avatar uploader on the profile page (same round
 * preview, same drag/zoom crop dialog, same CSS classes) but does NOT upload
 * anything itself. It hands the cropped image to RegisterForm through
 * onChange, and RegisterForm uploads it when the form is submitted.
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_OUTPUT_SIZE = 2 * 1024 * 1024;
const OUTPUT_SIZE = 512;
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

export type PreparedLogo = {
  blob: Blob;
  extension: "webp" | "jpg";
  contentType: "image/webp" | "image/jpeg";
};

type CropState = {
  naturalW: number;
  naturalH: number;
  scale: number;
  offsetX: number;
  offsetY: number;
};

function imageSizeInViewport(c: CropState) {
  const minSide = Math.min(c.naturalW, c.naturalH);
  return {
    w: (c.naturalW / minSide) * c.scale,
    h: (c.naturalH / minSide) * c.scale,
  };
}

function clampCrop(c: CropState): CropState {
  const { w: imgW, h: imgH } = imageSizeInViewport(c);
  let ox = c.offsetX;
  let oy = c.offsetY;
  if (imgW <= 1) ox = (1 - imgW) / 2;
  else ox = Math.min(0, Math.max(1 - imgW, ox));
  if (imgH <= 1) oy = (1 - imgH) / 2;
  else oy = Math.min(0, Math.max(1 - imgH, oy));
  return { ...c, offsetX: ox, offsetY: oy };
}

async function encodeCrop(
  bitmap: ImageBitmap,
  crop: CropState
): Promise<PreparedLogo> {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare this image.");

  const minSide = Math.min(crop.naturalW, crop.naturalH);
  const srcSize = minSide / crop.scale;
  const srcX = (-crop.offsetX * minSide) / crop.scale;
  const srcY = (-crop.offsetY * minSide) / crop.scale;

  const draw = () => {
    ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.drawImage(
      bitmap,
      srcX,
      srcY,
      srcSize,
      srcSize,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE
    );
  };
  const encode = (type: "image/webp" | "image/jpeg", quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

  draw();
  for (const quality of [0.85, 0.7, 0.55]) {
    const blob = await encode("image/webp", quality);
    if (!blob) throw new Error("Could not encode this image.");
    if (blob.type !== "image/webp") break; // browser can't encode WebP
    if (blob.size <= 500 * 1024 || quality === 0.55) {
      return { blob, extension: "webp", contentType: "image/webp" };
    }
  }

  // JPEG has no transparency, so paint a dark background first.
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  draw();
  for (const quality of [0.85, 0.7, 0.55]) {
    const blob = await encode("image/jpeg", quality);
    if (!blob || blob.type !== "image/jpeg") {
      throw new Error("Could not encode this image as JPEG.");
    }
    if (blob.size <= 500 * 1024 || quality === 0.55) {
      return { blob, extension: "jpg", contentType: "image/jpeg" };
    }
  }
  throw new Error("Could not encode this image.");
}

type Props = {
  disabled?: boolean;
  onChange: (logo: PreparedLogo | null) => void;
};

export default function TeamLogoUploader({ disabled, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropViewportRef = useRef<HTMLDivElement>(null);

  // Committed logo (shown in the round preview)
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Crop dialog state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [crop, setCrop] = useState<CropState | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null
  );
  const pinchStart = useRef<{
    distance: number;
    scale: number;
    ox: number;
    oy: number;
  } | null>(null);

  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = preparing || !!disabled;

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (logoUrl) URL.revokeObjectURL(logoUrl);
      bitmap?.close();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const closePreview = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    bitmap?.close();
    setBitmap(null);
    setCrop(null);
    setError(null);
    setDragging(false);
    dragStart.current = null;
    pinchStart.current = null;
  }, [previewUrl, bitmap]);

  useEffect(() => {
    if (!previewUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !preparing) closePreview();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closePreview, preparing, previewUrl]);

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError("Unsupported image type. Choose a PNG, JPEG, or WebP file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Image is too large. Choose a file no bigger than 10 MB.");
      return;
    }

    try {
      let bmp: ImageBitmap;
      try {
        bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      } catch {
        bmp = await createImageBitmap(file);
      }
      const minSide = Math.min(bmp.width, bmp.height);
      const initialOffsetX = -(bmp.width - minSide) / 2 / minSide;
      const initialOffsetY = -(bmp.height - minSide) / 2 / minSide;

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      bitmap?.close();

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setBitmap(bmp);
      setCrop(
        clampCrop({
          naturalW: bmp.width,
          naturalH: bmp.height,
          scale: 1,
          offsetX: initialOffsetX,
          offsetY: initialOffsetY,
        })
      );
    } catch {
      setSelectedFile(null);
      setPreviewUrl(null);
      setBitmap(null);
      setCrop(null);
      setError("Could not preview this image. Please choose another file.");
    }
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!crop || preparing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      ox: crop.offsetX,
      oy: crop.offsetY,
    };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging || !dragStart.current || !crop || !cropViewportRef.current)
      return;
    const rect = cropViewportRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragStart.current.x) / rect.width;
    const dy = (e.clientY - dragStart.current.y) / rect.height;
    setCrop(
      clampCrop({
        ...crop,
        offsetX: dragStart.current.ox + dx,
        offsetY: dragStart.current.oy + dy,
      })
    );
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    setDragging(false);
    dragStart.current = null;
  }

  // Pinch-to-zoom (mobile)
  useEffect(() => {
    const el = cropViewportRef.current;
    if (!el || !crop) return;

    function distance(t: TouchList) {
      return Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);
    }
    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2 && crop) {
        e.preventDefault();
        setDragging(false);
        dragStart.current = null;
        pinchStart.current = {
          distance: distance(e.touches),
          scale: crop.scale,
          ox: crop.offsetX,
          oy: crop.offsetY,
        };
      }
    }
    function onTouchMove(e: TouchEvent) {
      if (e.touches.length === 2 && pinchStart.current && crop) {
        e.preventDefault();
        const ratio = distance(e.touches) / pinchStart.current.distance;
        const nextScale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, pinchStart.current.scale * ratio)
        );
        const { w: oldW, h: oldH } = imageSizeInViewport({
          ...crop,
          scale: pinchStart.current.scale,
        });
        const { w: newW, h: newH } = imageSizeInViewport({
          ...crop,
          scale: nextScale,
        });
        const ox = 0.5 - ((0.5 - pinchStart.current.ox) / oldW) * newW;
        const oy = 0.5 - ((0.5 - pinchStart.current.oy) / oldH) * newH;
        setCrop(clampCrop({ ...crop, scale: nextScale, offsetX: ox, offsetY: oy }));
      }
    }
    function onTouchEnd() {
      pinchStart.current = null;
    }

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [crop]);

  function zoom(delta: number) {
    if (!crop) return;
    const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, crop.scale + delta));
    const { w: oldW, h: oldH } = imageSizeInViewport(crop);
    const { w: newW, h: newH } = imageSizeInViewport({ ...crop, scale: nextScale });
    const ox = 0.5 - ((0.5 - crop.offsetX) / oldW) * newW;
    const oy = 0.5 - ((0.5 - crop.offsetY) / oldH) * newH;
    setCrop(clampCrop({ ...crop, scale: nextScale, offsetX: ox, offsetY: oy }));
  }

  /** "Use logo": crop + compress, then hand it to the form (no upload here). */
  async function useLogo() {
    if (!bitmap || !crop || preparing) return;
    setPreparing(true);
    setError(null);
    try {
      const prepared = await encodeCrop(bitmap, crop);
      if (prepared.blob.size > MAX_OUTPUT_SIZE) {
        throw new Error("Image is still too large after resizing. Try a simpler image.");
      }
      if (logoUrl) URL.revokeObjectURL(logoUrl);
      setLogoUrl(URL.createObjectURL(prepared.blob));
      onChange(prepared);
      closePreview();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not prepare this image. Try another file."
      );
    } finally {
      setPreparing(false);
    }
  }

  function removeLogo() {
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogoUrl(null);
    setError(null);
    onChange(null);
  }

  const imgStyle: CSSProperties | undefined =
    crop && bitmap
      ? (() => {
          const { w, h } = imageSizeInViewport(crop);
          return {
            position: "absolute" as const,
            left: `${crop.offsetX * 100}%`,
            top: `${crop.offsetY * 100}%`,
            width: `${w * 100}%`,
            height: `${h * 100}%`,
            maxWidth: "none",
            pointerEvents: "none" as const,
          };
        })()
      : undefined;

  return (
    <div className="field">
      <span className="field-label" id="team-logo-label">
        Team logo
      </span>

      <div className="team-logo-row">
        <div className="avatar-uploader">
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept={ACCEPTED.join(",")}
            aria-label="Choose a team logo"
            onChange={handleFileSelection}
            disabled={busy}
          />
          <button
            type="button"
            className="avatar-uploader-preview"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            aria-labelledby="team-logo-label"
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Team logo preview" />
            ) : (
              <span aria-hidden="true">+</span>
            )}
          </button>
        </div>

        <div className="team-logo-body">
          <div className="avatar-uploader-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              {logoUrl ? "Change logo" : "Upload logo"}
            </button>
            {logoUrl && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={removeLogo}
                disabled={busy}
              >
                Remove
              </button>
            )}
          </div>
          <p className="field-hint">
            Optional. PNG, JPEG or WebP, up to 10 MB. You can crop and zoom
            before saving.
          </p>
        </div>
      </div>

      {error && !previewUrl && (
        <p className="avatar-uploader-error" role="alert">
          {error}
        </p>
      )}

      {previewUrl && selectedFile && crop && (
        <div
          className="avatar-preview-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !preparing) closePreview();
          }}
        >
          <section
            className="avatar-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logo-preview-title"
            aria-describedby="logo-preview-hint"
          >
            <h2 id="logo-preview-title">Adjust team logo</h2>

            <div
              ref={cropViewportRef}
              className={`avatar-crop-viewport${dragging ? " is-dragging" : ""}`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <img
                className="avatar-crop-image"
                src={previewUrl}
                alt=""
                draggable={false}
                style={imgStyle}
              />
              <div className="avatar-crop-mask" aria-hidden="true" />
            </div>

            <div className="avatar-crop-controls">
              <button
                type="button"
                className="btn btn-ghost avatar-zoom-btn"
                onClick={() => zoom(-0.25)}
                disabled={preparing || crop.scale <= MIN_SCALE}
                aria-label="Zoom out"
              >
                −
              </button>
              <span className="avatar-crop-zoom-label">
                {Math.round(crop.scale * 100)}%
              </span>
              <button
                type="button"
                className="btn btn-ghost avatar-zoom-btn"
                onClick={() => zoom(0.25)}
                disabled={preparing || crop.scale >= MAX_SCALE}
                aria-label="Zoom in"
              >
                +
              </button>
            </div>

            <p id="logo-preview-hint">
              Drag to move · pinch or +/− to zoom · fill the circle
            </p>

            {preparing && <p role="status">Preparing image...</p>}
            {error && (
              <p className="avatar-uploader-error" role="alert">
                {error}
              </p>
            )}
            <div className="avatar-preview-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closePreview}
                disabled={preparing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={useLogo}
                disabled={preparing}
              >
                {preparing ? "Preparing image..." : "Use logo"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
