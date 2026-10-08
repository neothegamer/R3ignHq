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

type CountryOption = { code: string; name: string };

function getCountryOptions(): CountryOption[] {
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  const countries: CountryOption[] = [];
  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code = String.fromCharCode(first, second);
      const name = names.of(code);
      if (name && name !== code) countries.push({ code, name });
    }
  }
  return countries.sort((a, b) => a.name.localeCompare(b.name));
}

const GAME_LABELS: Record<string, string> = {
  rcml: "RCML",
  rfcl: "RFCL",
  rbsl: "RBSL",
};

function countryFlag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(
    ...Array.from(code, (letter) => letter.charCodeAt(0) + 127397)
  );
}

function countryCodeFor(value: string | null, countryOptions: CountryOption[]) {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();
  return (
    countryOptions.find(
      ({ code, name }) =>
        code.toLowerCase() === normalized ||
        name.toLowerCase() === normalized
    )?.code ??
    (/^[a-z]{2}$/i.test(value) ? value.toUpperCase() : "")
  );
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
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);
  const [copied, setCopied] = useState("");
  const online = isOnline(profile.id);
  const nameValue = profile.display_name ?? "";

  useEffect(() => {
    setName(nameValue);
  }, [nameValue]);

  useEffect(() => {
    setBio(profile.bio ?? "");
  }, [profile.bio]);

  useEffect(() => {
    setCountryOptions(getCountryOptions());
  }, []);

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

  async function saveCountry(value: string) {
    const nextCountry = value || null;
    const previous = profile.country;
    setSavingCountry(true);
    setCountryMessage("");
    onProfileChange({ country: nextCountry });
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ country: nextCountry })
        .eq("id", profile.id);
      if (error) throw error;
      setCountryMessage("Country saved.");
    } catch (error: unknown) {
      onProfileChange({ country: previous });
      setCountryMessage(
        error instanceof Error
          ? error.message
          : "Could not save your country."
      );
    } finally {
      setSavingCountry(false);
    }
  }

  const countryCode = countryCodeFor(profile.country, countryOptions);
  const availableCountryOptions =
    profile.country &&
    !countryOptions.some(
      ({ name, code }) => name === profile.country || code === profile.country
    )
      ? [{ code: "", name: profile.country }, ...countryOptions]
      : countryOptions;

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
                {countryFlag(countryCodeFor(profile.country, countryOptions))}{" "}
                {profile.country}
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
          {(profile.selected_games ?? []).length > 0 && (
            <div className="public-profile-games" aria-label="Selected games">
              {profile.selected_games?.map((game) => (
                <span className="public-profile-badge" key={game}>
                  {GAME_LABELS[game.toLowerCase()] ?? game.toUpperCase()}
                </span>
              ))}
            </div>
          )}
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
              <label htmlFor="account-country">Country</label>
              <div className="profile-inline-control">
                <select
                  id="account-country"
                  value={
                    availableCountryOptions.find(
                      ({ name }) => name === profile.country
                    )?.name ??
                    availableCountryOptions.find(
                      ({ code }) => code === profile.country
                    )?.name ??
                    ""
                  }
                  disabled={savingCountry}
                  onChange={(event) => saveCountry(event.currentTarget.value)}
                >
                  <option value="">Select country</option>
                  {availableCountryOptions.map(({ code, name: countryName }) => (
                    <option key={`${code}-${countryName}`} value={countryName}>
                      {countryFlag(code)} {countryName}
                    </option>
                  ))}
                </select>
                {countryCode && (
                  <span aria-hidden="true" className="profile-country-flag">
                    {countryFlag(countryCode)}
                  </span>
                )}
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
          <div className="profile-selected-games">
            <strong>Selected games</strong>
            {profile.selected_games?.length ? (
              profile.selected_games.map((game) => (
                <span
                  className={`profile-game-chip profile-game-chip-${game.toLowerCase()}`}
                  key={game}
                >
                  {GAME_LABELS[game.toLowerCase()] ?? game.toUpperCase()}
                </span>
              ))
            ) : (
              <span className="profile-muted">No games selected</span>
            )}
          </div>
        </div>
      </div>
    </ProfileSection>
  );
}
