"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useR3ignDialog } from "@/components/R3ignDialog";
import ProfileSection, { SectionLoadError } from "./ProfileSection";
import type { BlockedUser, MutedUser } from "./account-types";

type Props = {
  profileId: string;
  email: string;
  blockedUsers: BlockedUser[];
  mutedUsers: MutedUser[];
  loadError?: string;
};

export default function SecuritySection({
  profileId,
  email,
  blockedUsers: initialBlockedUsers,
  mutedUsers: initialMutedUsers,
  loadError,
}: Props) {
  const supabase = createClient();
  const { confirm } = useR3ignDialog();
  const [blockedUsers, setBlockedUsers] = useState(initialBlockedUsers);
  const [mutedUsers, setMutedUsers] = useState(initialMutedUsers);
  const [emailInput, setEmailInput] = useState(email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailState, setEmailState] = useState<{
    loading: boolean;
    message: string;
    type: "success" | "error" | "idle";
  }>({ loading: false, message: "", type: "idle" });
  const [passwordState, setPasswordState] = useState<{
    loading: boolean;
    message: string;
    type: "success" | "error" | "idle";
  }>({ loading: false, message: "", type: "idle" });

  async function handleEmailUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextEmail = emailInput.trim();
    if (!nextEmail || !nextEmail.includes("@")) {
      setEmailState({
        loading: false,
        message: "Enter a valid email address.",
        type: "error",
      });
      return;
    }

    setEmailState({ loading: true, message: "", type: "idle" });
    try {
      const { error } = await supabase.auth.updateUser({ email: nextEmail });
      if (error) throw error;
      setEmailState({
        loading: false,
        message: "Check your inbox to confirm the email change.",
        type: "success",
      });
    } catch (error: unknown) {
      setEmailState({
        loading: false,
        message:
          error instanceof Error ? error.message : "Could not update your email.",
        type: "error",
      });
    }
  }

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      setPasswordState({
        loading: false,
        message: "Use a password at least 8 characters long.",
        type: "error",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordState({
        loading: false,
        message: "Passwords do not match.",
        type: "error",
      });
      return;
    }

    setPasswordState({ loading: true, message: "", type: "idle" });
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordState({
        loading: false,
        message: "Password updated successfully.",
        type: "success",
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      setPasswordState({
        loading: false,
        message:
          error instanceof Error ? error.message : "Could not update your password.",
        type: "error",
      });
    }
  }

  async function unblockUser(blockedId: string) {
    const user = blockedUsers.find((entry) => entry.blockedId === blockedId);
    if (!user) return;

    const confirmed = await confirm({
      title: "Unblock user",
      message: `Unblock ${user.displayName || "this player"}?`,
      confirmLabel: "Unblock",
      variant: "danger",
    });
    if (!confirmed) return;

    const previous = blockedUsers;
    setBlockedUsers((current) =>
      current.filter((row) => row.blockedId !== blockedId)
    );

    try {
      const { error } = await supabase
        .from("user_blocks")
        .delete()
        .eq("blocker_id", profileId)
        .eq("blocked_id", blockedId);
      if (error) throw error;
    } catch (error: unknown) {
      setBlockedUsers(previous);
      setPasswordState({
        loading: false,
        message:
          error instanceof Error ? error.message : "Could not unblock this user.",
        type: "error",
      });
    }
  }

  async function unmuteUser(mutedId: string) {
    const user = mutedUsers.find((entry) => entry.mutedId === mutedId);
    if (!user) return;

    const confirmed = await confirm({
      title: "Unmute conversation",
      message: `Unmute ${user.displayName || "this player"}?`,
      confirmLabel: "Unmute",
      variant: "danger",
    });
    if (!confirmed) return;

    const previous = mutedUsers;
    setMutedUsers((current) =>
      current.filter((row) => row.mutedId !== mutedId)
    );

    try {
      const { error } = await supabase
        .from("user_mutes")
        .delete()
        .eq("muter_id", profileId)
        .eq("muted_id", mutedId);
      if (error) throw error;
    } catch (error: unknown) {
      setMutedUsers(previous);
      setPasswordState({
        loading: false,
        message:
          error instanceof Error ? error.message : "Could not unmute this conversation.",
        type: "error",
      });
    }
  }

  return (
    <ProfileSection title="Security & privacy">
      <SectionLoadError message={loadError} />

      <div className="profile-stack">
        <form className="profile-inline-form" onSubmit={handleEmailUpdate}>
          <label className="field-label" htmlFor="profile-email">
            Email address
          </label>
          <div className="profile-inline-form-row">
            <input
              id="profile-email"
              type="email"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder="name@example.com"
              disabled={emailState.loading}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={emailState.loading}
            >
              {emailState.loading ? "Updating…" : "Update email"}
            </button>
          </div>
          {emailState.message && (
            <p
              className={
                emailState.type === "success"
                  ? "profile-inline-success"
                  : "profile-inline-error"
              }
              role="status"
            >
              {emailState.message}
            </p>
          )}
        </form>

        <form className="profile-inline-form" onSubmit={handlePasswordUpdate}>
          <label className="field-label" htmlFor="profile-password">
            Change password
          </label>
          <div className="profile-inline-form-row profile-inline-form-stack">
            <input
              id="profile-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="New password"
              disabled={passwordState.loading}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm password"
              disabled={passwordState.loading}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={passwordState.loading}
            >
              {passwordState.loading ? "Updating…" : "Update password"}
            </button>
          </div>
          <p className="field-hint">
            Use at least 8 characters with a mix of letters and numbers.
          </p>
          {passwordState.message && (
            <p
              className={
                passwordState.type === "success"
                  ? "profile-inline-success"
                  : "profile-inline-error"
              }
              role="status"
            >
              {passwordState.message}
            </p>
          )}
        </form>

        <div className="profile-subsection">
          <h3>Blocked users</h3>
          {blockedUsers.length === 0 ? (
            <p className="profile-empty-state">No blocked users.</p>
          ) : (
            <ul className="profile-row-list">
              {blockedUsers.map((user) => (
                <li key={user.blockedId} className="profile-list-row">
                  <span>{user.displayName || "Unknown player"}</span>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => unblockUser(user.blockedId)}
                  >
                    Unblock
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="profile-subsection">
          <h3>Muted conversations</h3>
          {mutedUsers.length === 0 ? (
            <p className="profile-empty-state">No muted conversations.</p>
          ) : (
            <ul className="profile-row-list">
              {mutedUsers.map((user) => (
                <li key={user.mutedId} className="profile-list-row">
                  <span>{user.displayName || "Unknown player"}</span>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => unmuteUser(user.mutedId)}
                  >
                    Unmute
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ProfileSection>
  );
}