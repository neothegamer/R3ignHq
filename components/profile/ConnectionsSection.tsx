"use client";

import { useState } from "react";
import { useR3ignDialog } from "@/components/R3ignDialog";
import { createClient } from "@/lib/supabase/client";
import ProfileSection, { SectionLoadError } from "./ProfileSection";
import type { AccountConnection } from "./account-types";

type Props = {
  profileId: string;
  connections: AccountConnection[];
  loadError?: string;
};

export default function ConnectionsSection({
  profileId,
  connections: initialConnections,
  loadError,
}: Props) {
  const supabase = createClient();
  const { confirm } = useR3ignDialog();
  const [connections, setConnections] = useState(initialConnections);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const discord = connections.find(
    (connection) => connection.provider.toLowerCase() === "discord"
  );

  async function unlink(connection: AccountConnection) {
    const confirmed = await confirm({
      title: "Unlink Discord",
      message: "Remove this Discord connection from your R3IGN account?",
      confirmLabel: "Unlink Discord",
      variant: "danger",
    });
    if (!confirmed || savingId) return;

    const previous = connections;
    setSavingId(connection.id);
    setConnections((current) =>
      current.filter((item) => item.id !== connection.id)
    );
    setError("");
    setSuccess("");
    try {
      const { error: unlinkError } = await supabase
        .from("connections")
        .delete()
        .eq("id", connection.id)
        .eq("profile_id", profileId);
      if (unlinkError) throw unlinkError;
      setSuccess("Discord has been unlinked.");
    } catch (unlinkError: unknown) {
      setConnections(previous);
      setError(
        unlinkError instanceof Error
          ? unlinkError.message
          : "Could not unlink Discord."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <ProfileSection title="Connections">
      <SectionLoadError message={loadError} />
      <div className="profile-connection-row">
        <div>
          <strong>Discord</strong>
          <span className="profile-muted">
            {discord
              ? `Connected${discord.username ? ` as ${discord.username}` : ""}`
              : "Not linked"}
          </span>
        </div>
        {discord ? (
          <button
            type="button"
            className="btn btn-ghost profile-danger-action"
            onClick={() => unlink(discord)}
            disabled={savingId === discord.id}
          >
            {savingId === discord.id ? "Unlinking…" : "Unlink"}
          </button>
        ) : (
          <span className="profile-status-badge is-inactive">Not linked</span>
        )}
      </div>
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
