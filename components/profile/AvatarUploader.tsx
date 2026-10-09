"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  type CSSProperties,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useR3ignDialog } from "@/components/R3ignDialog";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_COMPRESSED_FILE_SIZE = 2_097_152;
const EXTENSION_BY_TYPE: Record<string, "png" | "jpg" | "webp"> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
const BUCKET = "profile-avatars";
const OUTPUT_SIZE = 512;
/** Minimum scale so the shorter side of the image always covers the crop square. */
const MIN_SCALE = 1;
const MAX_SCALE = 4;

type CropState = {
  naturalW: number;
  naturalH: number;
  /** Multiplier on the cover scale (1 = image just covers the square). */
  scale: number;
  /** Offset of image top-left relative to crop viewport, in viewport units (0..1). */
  offsetX: number;
  offsetY: number;
};

/**
 * Cover scale: at scale=1 the image's shorter side equals the viewport.
 * Image size in viewport units = (natural / minSide) * scale
 */
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
): Promise<{
  blob: Blob;
  extension: "webp" | "jpg";
  contentType: "image/webp" | "image/jpeg";
}> {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare this image for upload.");

  const minSide = Math.min(crop.naturalW, crop.naturalH);
  // Source region in image pixels that maps to the 1×1 viewport
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
    if (blob.type !== "image/webp") break;
    if (blob.size <= 500 * 1024 || quality === 0.55) {
      return { blob, extension: "webp", contentType: "image/webp" };
    }
  }

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
  profileId: string;
  avatarUrl: string | null;
  displayName: string;
  onAvatarChange: (avatarUrl: string | null) => void;
};

export default function AvatarUploader({
  profileId,
  avatarUrl,
  displayName,
  onAvatarChange,
}: Props) {
  const supabase = createClient();
  const { confirm } = useR3ignDialog();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropViewportRef = useRef<HTMLDivElement>(null);

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
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      bitmap?.close();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 2500);
    return () => window.clearTimeout(t);
  }, [success]);

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
      if (e.key === "Escape" && !preparing && !uploading) closePreview();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closePreview, preparing, previewUrl, uploading]);

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    setError(null);
    setSuccess(null);
    if (!Object.hasOwn(EXTENSION_BY_TYPE, file.type)) {
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
      // Center the image so the crop square sits in the middle
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
    if (!crop || preparing || uploading) return;
    // Ignore multi-touch here; pinch is handled via touch events
    if (e.pointerType === "touch" && (e as unknown as TouchEvent).touches?.length > 1)
      return;
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
      const a = t[0];
      const b = t[1];
      return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
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
        // Zoom toward viewport center
        const { w: oldW, h: oldH } = imageSizeInViewport({
          ...crop,
          scale: pinchStart.current.scale,
        });
        const { w: newW, h: newH } = imageSizeInViewport({
          ...crop,
          scale: nextScale,
        });
        const cx = 0.5;
        const cy = 0.5;
        const ox = cx - ((cx - pinchStart.current.ox) / oldW) * newW;
        const oy = cy - ((cy - pinchStart.current.oy) / oldH) * newH;
        setCrop(
          clampCrop({
            ...crop,
            scale: nextScale,
            offsetX: ox,
            offsetY: oy,
          })
        );
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
    const cx = 0.5;
    const cy = 0.5;
    const ox = cx - ((cx - crop.offsetX) / oldW) * newW;
    const oy = cy - ((cy - crop.offsetY) / oldH) * newH;
    setCrop(
      clampCrop({ ...crop, scale: nextScale, offsetX: ox, offsetY: oy })
    );
  }

  async function deleteAvatarObject(path: string) {
    const { data, error: removalError } = await supabase.storage
      .from(BUCKET)
      .remove([path]);
    if (removalError) throw removalError;
    if (!data?.length) {
      throw new Error(`No profile avatar was deleted at storage path "${path}".`);
    }
  }

  async function cleanupAvatarFolder(userId: string, exceptFileName?: string) {
    if (!userId) return;
    try {
      const { data, error: listError } = await supabase.storage
        .from(BUCKET)
        .list(userId, { limit: 100 });
      if (listError) {
        console.warn("Could not list profile avatar files for cleanup:", listError);
        return;
      }
      const paths = (data ?? [])
        .filter(
          (file) =>
            file.id &&
            file.name &&
            file.name !== exceptFileName &&
            !file.name.includes("/") &&
            file.name !== "." &&
            file.name !== ".."
        )
        .map((file) => `${userId}/${file.name}`);
      if (paths.length === 0) return;
      const { data: removed, error: removeError } = await supabase.storage
        .from(BUCKET)
        .remove(paths);
      if (removeError) {
        console.warn("Could not clean up profile avatar files:", removeError);
      } else if (removed && removed.length < paths.length) {
        console.warn(
          `Profile avatar cleanup deleted ${removed.length} of ${paths.length} files.`
        );
      }
    } catch (cleanupError: unknown) {
      console.warn("Could not clean up profile avatar files:", cleanupError);
    }
  }

  async function uploadPhoto() {
    if (!selectedFile || !bitmap || !crop || preparing || uploading) return;

    setPreparing(true);
    setError(null);
    let uploadedPath: string | null = null;
    let profileUpdated = false;
    try {
      const preparedImage = await encodeCrop(bitmap, crop);
      if (preparedImage.blob.size > MAX_COMPRESSED_FILE_SIZE) {
        throw new Error(
          "Compressed image is too large to upload. Choose a smaller image."
        );
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user || !user.id || user.id !== profileId) {
        throw new Error("Sign in as this profile owner to change the avatar.");
      }

      const path = `${user.id}/${crypto.randomUUID()}.${preparedImage.extension}`;
      setPreparing(false);
      setUploading(true);

      let uploadResult;
      try {
        uploadResult = await supabase.storage
          .from(BUCKET)
          .upload(path, preparedImage.blob, {
            contentType: preparedImage.contentType,
            upsert: false,
          });
      } catch (networkError: unknown) {
        console.warn("Avatar upload failed:", networkError);
        if (
          networkError instanceof Error &&
          /network|fetch|connection|timeout/i.test(networkError.message)
        ) {
          throw new Error("Upload failed. Check your connection and try again.");
        }
        throw networkError;
      }
      if (uploadResult.error) {
        if (/network|fetch|connection|timeout/i.test(uploadResult.error.message)) {
          throw new Error("Upload failed. Check your connection and try again.");
        }
        throw uploadResult.error;
      }
      uploadedPath = path;

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id)
        .select("id")
        .single();
      if (updateError) throw updateError;
      profileUpdated = true;

      onAvatarChange(publicUrl);
      closePreview();
      setSuccess("Profile photo updated.");
      await cleanupAvatarFolder(user.id, path.split("/").pop());
    } catch (uploadError: unknown) {
      if (uploadedPath && !profileUpdated) {
        try {
          await deleteAvatarObject(uploadedPath);
        } catch (cleanupError: unknown) {
          console.warn(
            "Could not remove the newly uploaded profile avatar:",
            cleanupError
          );
        }
      }
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload the avatar. Please try again."
      );
    } finally {
      setPreparing(false);
      setUploading(false);
    }
  }

  async function removeAvatar() {
    const confirmed = await confirm({
      title: "Remove avatar",
      message: "Remove your current profile photo?",
      confirmLabel: "Remove avatar",
      variant: "danger",
    });
    if (!confirmed || removing) return;

    setRemoving(true);
    setError(null);
    setSuccess(null);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user || !user.id || user.id !== profileId) {
        throw new Error("Sign in as this profile owner to change the avatar.");
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id)
        .select("id")
        .single();
      if (updateError) throw updateError;

      onAvatarChange(null);
      await cleanupAvatarFolder(user.id);
      setSuccess("Profile photo removed.");
    } catch (removeError: unknown) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Could not remove the avatar. Please try again."
      );
    } finally {
      setRemoving(false);
    }
  }

  /**
   * Position the image with left/top in % of the viewport (parent),
   * and width/height in % of the viewport — avoids the CSS transform %
   * being relative to the image element itself.
   */
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
    <div className="avatar-uploader">
      <input
        ref={fileInputRef}
        className="visually-hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-label="Choose a profile photo"
        onChange={handleFileSelection}
        disabled={preparing || uploading || removing}
      />
      <button
        type="button"
        className={`avatar-uploader-preview${uploading ? " is-uploading" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        disabled={preparing || uploading || removing}
        aria-label="Change profile photo"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" />
        ) : (
          <span aria-hidden="true">
            {displayName.match(/[a-z]/i)?.[0].toUpperCase() ?? "R"}
          </span>
        )}
        {(preparing || uploading) && (
          <span className="avatar-uploader-spinner" aria-hidden="true" />
        )}
      </button>
      <div className="avatar-uploader-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={preparing || uploading || removing}
        >
          Change photo
        </button>
        {avatarUrl && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={removeAvatar}
            disabled={preparing || uploading || removing}
          >
            {removing ? "Removing…" : "Remove avatar"}
          </button>
        )}
      </div>
      {success && (
        <p className="avatar-uploader-success" role="status">
          {success}
        </p>
      )}
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
            if (
              event.target === event.currentTarget &&
              !preparing &&
              !uploading
            ) {
              closePreview();
            }
          }}
        >
          <section
            className="avatar-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="avatar-preview-title"
            aria-describedby="avatar-preview-hint"
          >
            <h2 id="avatar-preview-title">Adjust profile photo</h2>

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
                disabled={preparing || uploading || crop.scale <= MIN_SCALE}
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
                disabled={preparing || uploading || crop.scale >= MAX_SCALE}
                aria-label="Zoom in"
              >
                +
              </button>
            </div>

            <p id="avatar-preview-hint">
              Drag to move · pinch or +/− to zoom · fill the circle
            </p>

            {(preparing || uploading) && (
              <p role="status">
                {preparing ? "Preparing image..." : "Uploading..."}
              </p>
            )}
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
                disabled={preparing || uploading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={uploadPhoto}
                disabled={preparing || uploading}
              >
                {preparing
                  ? "Preparing image..."
                  : uploading
                    ? "Uploading..."
                    : "Upload photo"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
