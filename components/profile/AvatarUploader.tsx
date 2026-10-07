"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
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

async function prepareAvatarImage(
  file: File
): Promise<{
  blob: Blob;
  extension: "webp" | "jpg";
  contentType: "image/webp" | "image/jpeg";
}> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
  } catch {
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new Error(
        "Could not decode this image. Please choose another file."
      );
    }
  }

  try {
    const cropSize = Math.min(bitmap.width, bitmap.height);
    const outputSize = Math.min(512, cropSize);
    const sourceX = (bitmap.width - cropSize) / 2;
    const sourceY = (bitmap.height - cropSize) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not prepare this image for upload.");
    }

    const drawImage = () => {
      context.drawImage(
        bitmap,
        sourceX,
        sourceY,
        cropSize,
        cropSize,
        0,
        0,
        outputSize,
        outputSize
      );
    };
    const encode = (type: "image/webp" | "image/jpeg", quality: number) =>
      new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, type, quality);
      });

    drawImage();
    for (const quality of [0.85, 0.7, 0.55]) {
      const blob = await encode("image/webp", quality);
      if (!blob) {
        throw new Error("Could not encode this image.");
      }
      if (blob.type !== "image/webp") break;
      if (blob.size <= 500 * 1024 || quality === 0.55) {
        return { blob, extension: "webp", contentType: "image/webp" };
      }
    }

    context.clearRect(0, 0, outputSize, outputSize);
    if (file.type === "image/png" || file.type === "image/webp") {
      context.fillStyle = "#111";
      context.fillRect(0, 0, outputSize, outputSize);
    }
    drawImage();

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
  } finally {
    bitmap.close();
  }
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => setSuccess(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [success]);

  const closePreview = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!previewUrl) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !preparing && !uploading) closePreview();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closePreview, preparing, previewUrl, uploading]);

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
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
      setError(
        "Image is too large. Choose a file no bigger than 10 MB."
      );
      return;
    }

    try {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } catch {
      setSelectedFile(null);
      setPreviewUrl(null);
      setError("Could not preview this image. Please choose another file.");
    }
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
        return;
      }
      if (!removed?.length) {
        console.warn("Profile avatar cleanup found files, but none were deleted.");
      } else if (removed.length < paths.length) {
        console.warn(
          `Profile avatar cleanup deleted ${removed.length} of ${paths.length} files.`
        );
      }
    } catch (cleanupError: unknown) {
      console.warn("Could not clean up profile avatar files:", cleanupError);
    }
  }

  async function uploadPhoto() {
    if (!selectedFile || preparing || uploading) return;

    setPreparing(true);
    setError(null);
    let uploadedPath: string | null = null;
    let profileUpdated = false;
    try {
      const preparedImage = await prepareAvatarImage(selectedFile);
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
          throw new Error(
            "Upload failed. Check your connection and try again."
          );
        }
        throw networkError;
      }
      if (uploadResult.error) {
        if (/network|fetch|connection|timeout/i.test(uploadResult.error.message)) {
          console.warn("Avatar upload failed:", uploadResult.error);
          throw new Error(
            "Upload failed. Check your connection and try again."
          );
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
      await closePreview();
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
            {(displayName.trim().charAt(0) || "R").toUpperCase()}
          </span>
        )}
        {(preparing || uploading) && <span className="avatar-uploader-spinner" aria-hidden="true" />}
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

      {previewUrl && selectedFile && (
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
            <h2 id="avatar-preview-title">Preview profile photo</h2>
            <img className="avatar-preview-image" src={previewUrl} alt="Selected profile photo preview" />
            <p id="avatar-preview-hint">A square image looks best.</p>
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
