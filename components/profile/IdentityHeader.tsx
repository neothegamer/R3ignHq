"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import AvatarUploader from "./AvatarUploader";
import ProfileSection, { SectionLoadError } from "./ProfileSection";
import { useOnlinePresence } from "@/components/OnlinePresenceProvider";
import { createClient } from "@/lib/supabase/client";
import type { AccountProfile } from "./account-types";

type AccountProps = {
  mode?: "account";
  profile: AccountProfile;
  email: string;
  onProfileChange: (changes: Partial<AccountProfile>) => void;
  loadError?: string;
};

type PublicProps = {
  mode: "public";
  profile: AccountProfile;
};

type Props = AccountProps | PublicProps;

/** Competitive regions (COD Mobile Global leaderboard-style regions). */
const REGIONS = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "Oceania",
  "Other",
  "South America",
] as const;

type Region = (typeof REGIONS)[number];

function normalizeRegion(value: string | null | undefined): Region | "" {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();
  const match = REGIONS.find((region) => region.toLowerCase() === normalized);
  return match ?? "";
}

function memberSince(date: string | null) {
  if (!date) return "Not available";
  const parsed = new Date(date);
  if (!Number.isFinite(parsed.getTime())) return "Not available";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
  }).format(parsed);
}

export default function IdentityHeader(props: Props) {
  const { profile } = props;
  const publicId = profile.player_id || profile.league_id;
  const isPublic = props.mode === "public";
  const email = isPublic ? "" : props.email;
  const onProfileChange = (changes: Partial<AccountProfile>) => {
    if (props.mode !== "public") props.onProfileChange(changes);
  };
  const loadError = isPublic ? undefined : props.loadError;
  const supabase = createClient();
  const { isOnline } = useOnlinePresence();
  const [name, setName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [savingName, setSavingName] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [savingCountry, setSavingCountry] = useState(false);
  const [nameMessage, setNameMessage] = useState("");
  const [bioMessage, setBioMessage] = useState("");
  const [countryMessage, setCountryMessage] = useState("");
  const [region, setRegion] = useState<string>(() => normalizeRegion(profile.country));
  const [copied, setCopied] = useState("");
  const online = isOnline(profile.id);

  useEffect(() => {
    setRegion(normalizeRegion(profile.country));
  }, [profile.country]);

  const nameValue = profile.display_name ?? "";

  useEffect(() => {
    setName(nameValue);
  }, [nameValue]);

  useEffect(() => {
    setBio(profile.bio ?? "");
  }, [profile.bio]);

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setCopied(`${label} copy unavailable`);
      window.setTimeout(() => setCopied(""), 2500);
    }
  }

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) {
      setNameMessage("Display name cannot be empty.");
      return;
    }
    if (nextName === nameValue) {
      setNameMessage("No display-name changes to save.");
      return;
    }

    setSavingName(true);
    setNameMessage("");
    try {
      const { data: taken, error: rpcError } = await supabase.rpc(
        "is_display_name_taken",
        { p_name: nextName }
      );
      if (rpcError) throw rpcError;
      if (
        taken &&
        nextName.toLocaleLowerCase() !== nameValue.toLocaleLowerCase()
      ) {
        setName(nameValue);
        setNameMessage("That display name is already in use.");
        return;
      }

      onProfileChange({ display_name: nextName });
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: nextName })
        .eq("id", profile.id);
      if (error) {
        onProfileChange({ display_name: nameValue });
        setName(nameValue);
        throw error;
      }
      setNameMessage("Display name saved.");
    } catch (error: unknown) {
      setNameMessage(
        error instanceof Error
          ? error.message
          : "Could not save your display name."
      );
    } finally {
      setSavingName(false);
    }
  }

  async function saveBio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextBio = bio.trim();
    if (nextBio.length > 300) {
      setBioMessage("Bio must be 300 characters or fewer.");
      return;
    }

    setSavingBio(true);
    setBioMessage("");
    const previous = profile.bio;
    onProfileChange({ bio: nextBio || null });
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ bio: nextBio || null })
        .eq("id", profile.id);
      if (error) throw error;
      setBioMessage("Bio saved.");
    } catch (error: unknown) {
      onProfileChange({ bio: previous });
      setBio(previous ?? "");
      setBioMessage(
        error instanceof Error ? error.message : "Could not save your bio."
      );
    } finally {
      setSavingBio(false);
    }
  }

  async function saveRegion(event?: { preventDefault?: () => void }) {
    event?.preventDefault?.();
    const nextRegion = region.trim() || null;
    if (nextRegion && !normalizeRegion(nextRegion)) {
      setCountryMessage("Choose a valid region from the list.");
      return;
    }
    const previous = profile.country;
    setSavingCountry(true);
    setCountryMessage("");
    onProfileChange({ country: nextRegion });
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ country: nextRegion })
        .eq("id", profile.id)
        .select("id")
        .single();
      if (error) throw error;
      setCountryMessage("Region saved.");
    } catch (error: unknown) {
      onProfileChange({ country: previous });
      setRegion(normalizeRegion(previous));
      setCountryMessage(
        error instanceof Error
          ? error.message
          : "Could not save your region."
      );
    } finally {
      setSavingCountry(false);
    }
  }

  if (isPublic) {
    return (
      <section className="public-profile-hero wrap">
        <div className="public-profile-avatar">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" />
          ) : (
            <span aria-hidden="true">R3</span>
          )}
        </div>
        <div className="public-profile-identity">
          <span className="eyebrow">R3IGN Player</span>
          <h1>{profile.display_name || "Player"}</h1>
          <div className="public-profile-identifiers">
            {publicId && (
              <span className="public-profile-badge">
                Player ID · {publicId}
              </span>
            )}
            {profile.country && (
              <span className="public-profile-badge">
                {normalizeRegion(profile.country) || profile.country}
              </span>
            )}
          </div>
          <p className="public-profile-presence" role="status">
            <span
              className={`public-profile-presence-dot${online ? " is-online" : ""}`}
              aria-hidden="true"
            />
            {online ? "Online" : "Offline"}
            <span> · Member since {memberSince(profile.created_at)}</span>
          </p>
          {profile.bio && <p className="public-profile-bio">{profile.bio}</p>}
        </div>
      </section>
    );
  }

  return (
    <ProfileSection
      icon={isPublic ? "◈" : undefined}
      title="Player identity"
      className="profile-section-wide profile-identity-section"
    >
      <SectionLoadError message={loadError} />
      <div className="profile-identity-layout">
        <div className="profile-identity-avatar">
          <AvatarUploader
            profileId={profile.id}
            avatarUrl={profile.avatar_url}
            displayName={profile.display_name ?? ""}
            onAvatarChange={(avatarUrl) =>
              onProfileChange({ avatar_url: avatarUrl })
            }
          />
          <span
            className={`profile-online-status${online ? " is-online" : ""}`}
            aria-label={online ? "Online" : "Offline"}
          >
            <span aria-hidden="true" />
            {online ? "Online" : "Offline"}
          </span>
        </div>
        <div className="profile-identity-main">
          <div className="profile-identity-title">
            <div>
              <h2>{profile.display_name || "R3IGN Player"}</h2>
              <p>{email || "No email address available"}</p>
            </div>
            {publicId && (
              <div className="profile-public-actions">
                <Link
                  href={`/player/${encodeURIComponent(publicId)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost"
                >
                  ◉ View public profile
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    copyValue(
                      `${window.location.origin}/player/${encodeURIComponent(publicId)}`,
                      "Link copied"
                    )
                  }
                >
                  Copy profile link
                </button>
              </div>
            )}
          </div>

          <div className="profile-id-badges">
            {publicId && (
              <button
                type="button"
                className="profile-id-badge"
                onClick={() => copyValue(publicId, "Player ID copied")}
                title="Copy Player ID"
              >
                Player ID · {publicId}
              </button>
            )}
            {copied && <span className="profile-copy-feedback">{copied}</span>}
          </div>

          <div className="profile-identity-fields">
            <form className="profile-edit-field" onSubmit={saveName}>
              <label htmlFor="account-display-name">Display name</label>
              <div className="profile-inline-control">
                <input
                  id="account-display-name"
                  value={name}
                  maxLength={48}
                  onChange={(event) => setName(event.currentTarget.value)}
                  disabled={savingName}
                />
                <button
                  className="btn btn-ghost"
                  type="submit"
                  disabled={savingName}
                >
                  {savingName ? "Saving…" : "Save"}
                </button>
              </div>
              {nameMessage && (
                <p
                  className={
                    nameMessage.includes("saved")
                      ? "profile-inline-success"
                      : "profile-inline-error"
                  }
                  role="status"
                >
                  {nameMessage}
                </p>
              )}
            </form>

            <div className="profile-edit-field">
              <label htmlFor="account-region">Region</label>
              <div className="profile-inline-control">
                <select
                  id="account-region"
                  value={region}
                  disabled={savingCountry}
                  onChange={(event) => {
                    setRegion(event.currentTarget.value);
                    setCountryMessage("");
                  }}
                >
                  <option value="">Select region</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={savingCountry || region === normalizeRegion(profile.country)}
                  onClick={() => saveRegion()}
                >
                  {savingCountry ? "Saving…" : "Save"}
                </button>
              </div>
              {countryMessage && (
                <p
                  className={
                    countryMessage.includes("saved")
                      ? "profile-inline-success"
                      : "profile-inline-error"
                  }
                  role="status"
                >
                  {countryMessage}
                </p>
              )}
            </div>

            <form className="profile-edit-field profile-bio-field" onSubmit={saveBio}>
              <label htmlFor="account-bio">Bio</label>
              <textarea
                id="account-bio"
                value={bio}
                maxLength={300}
                rows={3}
                onChange={(event) => setBio(event.currentTarget.value)}
              />
              <div className="profile-bio-footer">
                <span>{bio.length}/300</span>
                <button
                  className="btn btn-ghost"
                  type="submit"
                  disabled={savingBio}
                >
                  {savingBio ? "Saving…" : "Save bio"}
                </button>
              </div>
              {bioMessage && (
                <p
                  className={
                    bioMessage.includes("saved")
                      ? "profile-inline-success"
                      : "profile-inline-error"
                  }
                  role="status"
                >
                  {bioMessage}
                </p>
              )}
            </form>
          </div>

          <div className="profile-identity-meta">
            <span>Member since {memberSince(profile.created_at)}</span>
            <span>·</span>
            <span>{online ? "Currently online" : "Currently offline"}</span>
          </div>
        </div>
      </div>
    </ProfileSection>
  );
}
