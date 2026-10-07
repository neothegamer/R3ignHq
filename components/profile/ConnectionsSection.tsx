"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useR3ignDialog } from "@/components/R3ignDialog";
import { createClient } from "@/lib/supabase/client";
import ProfileSection from "./ProfileSection";

type Props = {
  discordIdentity: { username: string | null } | null;
  identityCount: number;
};

export default function ConnectionsSection({
  discordIdentity: initialDiscordIdentity,
  identityCount: initialIdentityCount,
}: Props) {
  const supabase = createClient();
  const router = useRouter();
  const { confirm } = useR3ignDialog();
  const [discordIdentity, setDiscordIdentity] = useState(initialDiscordIdentity);
  const [identityCount, setIdentityCount] = useState(initialIdentityCount);
  const [busy, setBusy] = useState<"link" | "unlink" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function linkDiscord() {
    if (busy) return;
    setBusy("link");
    setError("");
    setSuccess("");

    try {
      const { error: linkError } = await supabase.auth.linkIdentity({
        provider: "discord",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/account`,
        },
      });
      if (linkError) throw linkError;
    } catch (linkError: unknown) {
      setError(
        linkError instanceof Error
          ? linkError.message
          : "Could not start Discord linking."
      );
    } finally {
      setBusy(null);
    }
  }

  async function unlinkDiscord() {
    if (busy) return;

    const confirmed = await confirm({
      title: "Unlink Discord",
      message: "Remove Discord as a sign-in method for your R3IGN account?",
      confirmLabel: "Unlink Discord",
      variant: "danger",
    });
    if (!confirmed) return;

    setBusy("unlink");
    setError("");
    setSuccess("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Your session has expired. Sign in again.");

      const identities = user.identities ?? [];
      if (identities.length <= 1) {
        throw new Error(
          "Discord is your only sign-in method and cannot be unlinked."
        );
      }

      const identity = identities.find(
        (candidate) => candidate.provider.toLowerCase() === "discord"
      );
      if (!identity) {
        setDiscordIdentity(null);
        setIdentityCount(identities.length);
        router.refresh();
        return;
      }

      const { error: unlinkError } =
        await supabase.auth.unlinkIdentity(identity);
      if (unlinkError) throw unlinkError;

      setDiscordIdentity(null);
      setIdentityCount(identities.length - 1);
      setSuccess("Discord has been unlinked.");
      router.refresh();
    } catch (unlinkError: unknown) {
      setError(
        unlinkError instanceof Error
          ? unlinkError.message
          : "Could not unlink Discord."
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <ProfileSection title="Connections">
      <div className="profile-connection-row">
        <div>
          <strong>Discord</strong>
          <span className="profile-muted">
            {discordIdentity
              ? `Connected${discordIdentity.username ? ` as ${discordIdentity.username}` : ""}`
              : "Not linked"}
          </span>
        </div>
        {discordIdentity ? (
          <button
            type="button"
            className="btn btn-ghost profile-danger-action"
            onClick={unlinkDiscord}
            disabled={busy !== null || identityCount <= 1}
          >
            {busy === "unlink" ? "Unlinking…" : "Unlink"}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={linkDiscord}
            disabled={busy !== null}
          >
            {busy === "link" ? "Connecting…" : "Link Discord"}
          </button>
        )}
      </div>
      {discordIdentity && identityCount <= 1 && (
        <p className="profile-inline-note">
          Discord is your only sign-in method and cannot be unlinked.
        </p>
      )}
      <div className="profile-connection-row">
        <div>
          <strong>TikTok</strong>
          <span className="profile-muted">Connect your social account</span>
        </div>
        <span className="profile-status-badge is-inactive">Coming soon</span>
      </div>
      {error && <p className="profile-inline-error" role="alert">{error}</p>}
      {success && (
        <p className="profile-inline-success" role="status">{success}</p>
      )}
    </ProfileSection>
  );
}
