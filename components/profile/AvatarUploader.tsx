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

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const BUCKET = "profile-avatars";

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
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => setSuccess(false), 2500);
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
      if (event.key === "Escape" && !uploading) closePreview();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closePreview, previewUrl, uploading]);

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    setError(null);
    setSuccess(false);
    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Images must be 2 MB or smaller.");
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

  async function removeOldAvatar(url: string, userId: string) {
    try {
      const publicBase = new URL(
        process.env.NEXT_PUBLIC_SUPABASE_URL!
      );
      const avatar = new URL(url);
      if (avatar.origin !== publicBase.origin) return;

      const marker = `/storage/v1/object/public/${BUCKET}/`;
      const markerIndex = avatar.pathname.indexOf(marker);
      if (markerIndex < 0) return;

      const path = decodeURIComponent(
        avatar.pathname.slice(markerIndex + marker.length)
      );
      if (!path.startsWith(`${userId}/`)) return;

      const { error: removalError } = await supabase.storage
        .from(BUCKET)
        .remove([path]);
      if (removalError) {
        console.warn("Could not remove the previous profile avatar:", removalError);
      }
    } catch (removalError: unknown) {
      console.warn("Could not remove the previous profile avatar:", removalError);
    }
  }

  async function uploadPhoto() {
    if (!selectedFile || uploading) return;

    setUploading(true);
    setError(null);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user || user.id !== profileId) {
        throw new Error("Sign in as this profile owner to change the avatar.");
      }

      const { data: currentProfile, error: profileError } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      if (profileError) throw profileError;
      const oldAvatarUrl = currentProfile.avatar_url;

      const safeFilename = selectedFile.name.replace(/[^\w.-]+/g, "_");
      const path = `${user.id}/${Date.now()}-${safeFilename}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, selectedFile, {
          contentType: selectedFile.type,
          upsert: false,
        });
      if (uploadError) throw uploadError;

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

      onAvatarChange(publicUrl);
      await closePreview();
      setSuccess(true);
      if (oldAvatarUrl) await removeOldAvatar(oldAvatarUrl, user.id);
    } catch (uploadError: unknown) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload the avatar. Please try again."
      );
    } finally {
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
    setSuccess(false);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user || user.id !== profileId) {
        throw new Error("Sign in as this profile owner to change the avatar.");
      }

      const { data: currentProfile, error: profileError } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      if (profileError) throw profileError;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id)
        .select("id")
        .single();
      if (updateError) throw updateError;

      onAvatarChange(null);
      setSuccess(true);
      if (currentProfile.avatar_url) {
        await removeOldAvatar(currentProfile.avatar_url, user.id);
      }
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
        disabled={uploading || removing}
      />
      <button
        type="button"
        className={`avatar-uploader-preview${uploading ? " is-uploading" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || removing}
        aria-label="Change profile photo"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" />
        ) : (
          <span aria-hidden="true">
            {(displayName.trim().charAt(0) || "R").toUpperCase()}
          </span>
        )}
        {uploading && <span className="avatar-uploader-spinner" aria-hidden="true" />}
      </button>
      <div className="avatar-uploader-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || removing}
        >
          Change photo
        </button>
        {avatarUrl && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={removeAvatar}
            disabled={uploading || removing}
          >
            {removing ? "Removing…" : "Remove avatar"}
          </button>
        )}
      </div>
      {success && (
        <p className="avatar-uploader-success" role="status">
          Profile photo updated.
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
            if (event.target === event.currentTarget && !uploading) {
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
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={uploadPhoto}
                disabled={uploading}
              >
                {uploading ? "Uploading…" : "Upload photo"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
