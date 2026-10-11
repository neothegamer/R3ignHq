"use client";

import Link from "next/link";
import { useState } from "react";
import { useR3ignDialog } from "@/components/R3ignDialog";
import { createClient } from "@/lib/supabase/client";
import ProfileSection, { SectionLoadError } from "./ProfileSection";
import type { TeamMembership } from "./account-types";

type Props = {
  mode?: "account" | "public";
  profileId: string;
  memberships: TeamMembership[];
  loadError?: string;
};

const ROLE_COLORS: Record<string, string> = {
  owner: "role-owner",
  captain: "role-captain",
  player: "role-player",
  coach: "role-coach",
  manager: "role-manager",
};

function organizationSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function joinedDate(date: string) {
  const parsed = new Date(date);
  if (!Number.isFinite(parsed.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsed);
}

export default function MyTeamsSection({
  mode = "account",
  profileId,
  memberships: initialMemberships,
  loadError,
}: Props) {
  const supabase = createClient();
  const { confirm } = useR3ignDialog();
  const [memberships, setMemberships] = useState(initialMemberships);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeMemberships = memberships.filter(
    (membership) => membership.status === "active"
  );
  const invitations = memberships.filter(
    (membership) => membership.status === "invited"
  );

  async function leaveTeam(membership: TeamMembership) {
    const teamName = membership.organizationName ?? "this organization";
    const confirmed = await confirm({
      title: "Leave team",
      message: `Leave ${teamName}? Your membership will be marked as left.`,
      confirmLabel: "Leave team",
      variant: "danger",
    });
    if (!confirmed || savingId) return;

    const previous = memberships;
    setSavingId(membership.id);
    setMemberships((current) =>
      current.map((row) =>
        row.id === membership.id ? { ...row, status: "left" } : row
      )
    );
    setError("");
    setSuccess("");
    try {
      const { error: updateError } = await supabase
        .from("organization_members")
        .update({ status: "left" })
        .eq("id", membership.id)
        .eq("profile_id", profileId)
        .eq("status", "active");
      if (updateError) throw updateError;
      setSuccess("You have left the team.");
    } catch (updateError: unknown) {
      setMemberships(previous);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not leave this team."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function acceptInvitation(invitation: TeamMembership) {
    if (savingId) return;

    const previous = memberships;
    setSavingId(invitation.id);
    setMemberships((current) =>
      current.map((row) =>
        row.id === invitation.id ? { ...row, status: "active" } : row
      )
    );
    setError("");
    setSuccess("");

    try {
      const { error: updateError } = await supabase
        .from("organization_members")
        .update({ status: "active" })
        .eq("id", invitation.id)
        .eq("profile_id", profileId)
        .eq("status", "invited");
      if (updateError) throw updateError;
      setSuccess(
        `You joined ${invitation.organizationName ?? "the team"}.`
      );
    } catch (updateError: unknown) {
      setMemberships(previous);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not accept this invitation."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function declineInvitation(invitation: TeamMembership) {
    const teamName = invitation.organizationName ?? "this organization";
    const confirmed = await confirm({
      title: "Decline invitation",
      message: `Decline the invitation to join ${teamName}?`,
      confirmLabel: "Decline",
      variant: "danger",
    });
    if (!confirmed || savingId) return;

    const previous = memberships;
    setSavingId(invitation.id);
    setMemberships((current) =>
      current.map((row) =>
        row.id === invitation.id ? { ...row, status: "declined" } : row
      )
    );
    setError("");
    setSuccess("");

    try {
      const { error: updateError } = await supabase
        .from("organization_members")
        .update({ status: "declined" })
        .eq("id", invitation.id)
        .eq("profile_id", profileId)
        .eq("status", "invited");
      if (updateError) throw updateError;
      setSuccess("Invitation declined.");
    } catch (updateError: unknown) {
      setMemberships(previous);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not decline this invitation."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <ProfileSection
      icon={mode === "public" ? "♧" : undefined}
      title="My teams"
    >
      <SectionLoadError message={loadError} />

      {activeMemberships.length > 0 && (
        <div className="profile-team-list">
          {activeMemberships.map((membership) => {
            const teamName = membership.organizationName ?? "Organization";
            return (
              <article className="profile-team-row" key={membership.id}>
                <div>
                  {membership.organizationName ? (
                    <Link
                      className="profile-team-name"
                      href={`/org?name=${encodeURIComponent(
                        organizationSlug(membership.organizationName)
                      )}`}
                    >
                      {teamName}
                    </Link>
                  ) : (
                    <strong className="profile-team-name">{teamName}</strong>
                  )}
                  <span className="profile-team-meta">
                    Joined {joinedDate(membership.joinedAt)}
                  </span>
                </div>
                <span
                  className={`profile-role-badge ${
                    ROLE_COLORS[membership.role] ?? "role-player"
                  }`}
                >
                  {membership.role}
                </span>
                {mode === "account" && (
                  <button
                    type="button"
                    className="btn btn-ghost profile-danger-action"
                    onClick={() => leaveTeam(membership)}
                    disabled={savingId === membership.id}
                  >
                    {savingId === membership.id ? "Leaving…" : "Leave team"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      {mode === "account" && invitations.length > 0 && (
        <div className="profile-invitation-list">
          <h3>Pending invitations</h3>
          {invitations.map((invitation) => (
            <article className="profile-team-row" key={invitation.id}>
              <div>
                <strong>{invitation.organizationName ?? "Organization"}</strong>
                <span className="profile-team-meta">
                  {invitation.inviterName
                    ? `Invited by ${invitation.inviterName}`
                    : "Invitation pending"}
                  {invitation.role ? ` · ${invitation.role}` : ""}
                </span>
              </div>
              <div className="profile-row-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => acceptInvitation(invitation)}
                  disabled={savingId === invitation.id}
                >
                  {savingId === invitation.id ? "Accepting…" : "Accept"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost profile-danger-action"
                  onClick={() => declineInvitation(invitation)}
                  disabled={savingId === invitation.id}
                >
                  {savingId === invitation.id ? "…" : "Decline"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {mode === "account" &&
        !activeMemberships.length &&
        !invitations.length &&
        !loadError && (
          <div className="profile-empty-state">
            <p>
              You&apos;re not in any teams yet — join one via the player market
              or register with an organization.
            </p>
          </div>
        )}

      {error && (
        <p className="profile-inline-error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="profile-inline-success" role="status">
          {success}
        </p>
      )}
    </ProfileSection>
  );
}