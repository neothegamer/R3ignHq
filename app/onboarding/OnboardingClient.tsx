"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AvatarUploader from "@/components/profile/AvatarUploader";
import { createClient } from "@/lib/supabase/client";

export type OnboardingGameId = "codm" | "freefire" | "bloodstrike";

type GameProfileDraft = {
  ign: string;
  player_uid: string;
  country: string;
  role: string;
  team_clan: string;
  experience: string;
};

const GAMES: Record<
  OnboardingGameId,
  {
    label: string;
    short: string;
    roles: string[];
    teamLabel: string;
    hasExperience: boolean;
  }
> = {
  codm: {
    label: "Call of Duty: Mobile",
    short: "CODM",
    roles: ["Slayer/Fragger", "Objective", "Support", "Sniper", "IGL/Shot Caller", "Flex"],
    teamLabel: "Clan / Organization",
    hasExperience: true,
  },
  freefire: {
    label: "Free Fire",
    short: "Free Fire",
    roles: ["Rusher", "Fragger", "Support", "Sniper", "IGL", "Flex"],
    teamLabel: "Guild / Team",
    hasExperience: false,
  },
  bloodstrike: {
    label: "Blood Strike",
    short: "Blood Strike",
    roles: ["Fragger", "Support", "Sniper", "Entry", "IGL", "Flex"],
    teamLabel: "Team / Clan",
    hasExperience: false,
  },
};

const GAME_ORDER: OnboardingGameId[] = ["codm", "freefire", "bloodstrike"];

/** Map onboarding game ids → game_accounts league ids used on /account */
const ONBOARDING_TO_ACCOUNT_GAME: Record<OnboardingGameId, "rcml" | "rfcl" | "rbsl"> = {
  codm: "rcml",
  freefire: "rfcl",
  bloodstrike: "rbsl",
};
const HQ_INVITE = "https://discord.gg/85qGDxyCdp";

export type OnboardingInitialData = {
  userId: string;
  displayName: string;
  country: string;
  bio: string;
  playerId: string;
  avatarUrl: string | null;
  selectedGames: OnboardingGameId[];
  hqJoined: boolean;
  step: number;
  gameProfiles: Partial<Record<OnboardingGameId, GameProfileDraft>>;
  connections: { provider: string; username: string | null }[];
  linkedProviders: string[];
};

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

function countryFlag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(
    ...Array.from(code, (letter) => letter.charCodeAt(0) + 127397)
  );
}

function emptyDraft(defaultCountry: string): GameProfileDraft {
  return {
    ign: "",
    player_uid: "",
    country: defaultCountry,
    role: "",
    team_clan: "",
    experience: "",
  };
}

function clampStep(step: number) {
  if (!Number.isFinite(step)) return 1;
  return Math.min(Math.max(Math.trunc(step), 1), 6);
}

export default function OnboardingClient({
  initial,
}: {
  initial: OnboardingInitialData;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(() => clampStep(initial.step));
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [country, setCountry] = useState(initial.country || "Nigeria");
  const [bio, setBio] = useState(initial.bio);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [selectedGames, setSelectedGames] = useState<OnboardingGameId[]>(
    initial.selectedGames
  );
  const [drafts, setDrafts] = useState<Record<string, GameProfileDraft>>(() => {
    const base: Record<string, GameProfileDraft> = {};
    for (const game of GAME_ORDER) {
      base[game] = initial.gameProfiles[game] ?? emptyDraft(initial.country || "Nigeria");
    }
    return base;
  });
  const [savedGames, setSavedGames] = useState<Set<string>>(
    () => new Set(Object.keys(initial.gameProfiles))
  );
  const [hqJoined, setHqJoined] = useState(initial.hqJoined);
  const [connections] = useState(initial.connections);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{
    text: string;
    kind: "error" | "success";
  } | null>(null);

  const countryOptions = useMemo(getCountryOptions, []);

  const connectedProviders = useMemo(() => {
    return new Set<string>([
      ...connections.map((connection) => connection.provider.toLowerCase()),
      ...initial.linkedProviders,
    ]);
  }, [connections, initial.linkedProviders]);

  const discordConnected = connectedProviders.has("discord");
  const tiktokConnected = connectedProviders.has("custom:tiktok") || connectedProviders.has("tiktok");

  function showNotice(text: string, kind: "error" | "success") {
    setNotice({ text, kind });
  }

  async function saveProfile(fields: Record<string, unknown>) {
    const { error } = await supabase
      .from("profiles")
      .update(fields)
      .eq("id", initial.userId);
    if (error) throw error;
  }

  function goToStep(next: number) {
    setStep(next);
    saveProfile({ onboarding_step: next }).catch(() => {});
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function draftIsComplete(game: OnboardingGameId) {
    const draft = drafts[game];
    const meta = GAMES[game];
    if (!draft) return false;
    if (!draft.ign.trim() || !draft.player_uid.trim() || !draft.country || !draft.role) {
      return false;
    }
    if (meta.hasExperience && !draft.experience) return false;
    return true;
  }

  // ---------- STEP 1 ----------
  async function continueFromStep1() {
    const name = displayName.trim();
    if (!name) return showNotice("Display name is required.", "error");
    if (!country) return showNotice("Country / Region is required.", "error");

    setBusy(true);
    try {
      const { data: taken, error: rpcError } = await supabase.rpc(
        "is_display_name_taken",
        { p_name: name }
      );
      if (rpcError) throw rpcError;
      if (
        taken &&
        name.toLocaleLowerCase() !== initial.displayName.toLocaleLowerCase()
      ) {
        return showNotice("That display name is already in use.", "error");
      }

      await saveProfile({
        display_name: name,
        country,
        bio: bio.trim() || null,
        onboarding_step: 2,
      });
      showNotice("Basic profile saved.", "success");
      goToStep(2);
    } catch (error) {
      showNotice(
        error instanceof Error ? error.message : "Could not save. Try again.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  // ---------- STEP 2 ----------
  function toggleGame(game: OnboardingGameId) {
    setSelectedGames((current) =>
      current.includes(game)
        ? current.filter((entry) => entry !== game)
        : [...current, game]
    );
  }

  async function continueFromStep2() {
    if (selectedGames.length === 0) {
      return showNotice("Select at least one game to continue.", "error");
    }
    setBusy(true);
    try {
      await saveProfile({
        selected_games: selectedGames,
        onboarding_step: 3,
      });
      showNotice("Games saved.", "success");
      goToStep(3);
    } catch (error) {
      showNotice(
        error instanceof Error ? error.message : "Could not save games. Try again.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  // ---------- STEP 3 ----------
  function updateDraft(game: OnboardingGameId, patch: Partial<GameProfileDraft>) {
    setDrafts((current) => ({
      ...current,
      [game]: { ...current[game], ...patch },
    }));
    setSavedGames((current) => {
      const next = new Set(current);
      next.delete(game);
      return next;
    });
  }

  async function saveGame(game: OnboardingGameId) {
    const draft = drafts[game];
    const meta = GAMES[game];
    if (!draft.ign.trim() || !draft.player_uid.trim() || !draft.country || !draft.role) {
      return showNotice(`Fill all required fields for ${meta.short}.`, "error");
    }
    if (meta.hasExperience && !draft.experience) {
      return showNotice("Select a competitive experience level.", "error");
    }

    setBusy(true);
    try {
      const { error } = await supabase.from("game_profiles").upsert(
        {
          profile_id: initial.userId,
          game,
          ign: draft.ign.trim(),
          player_uid: draft.player_uid.trim(),
          country: draft.country,
          role: draft.role,
          team_clan: draft.team_clan.trim() || null,
          experience: draft.experience || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "profile_id,game" }
      );
      if (error) throw error;

      // Also register as a game account so it appears under Game Accounts on /account
      const accountGame = ONBOARDING_TO_ACCOUNT_GAME[game];
      const { error: accountError } = await supabase.from("game_accounts").upsert(
        {
          profile_id: initial.userId,
          game: accountGame,
          ign: draft.ign.trim(),
          game_uid: draft.player_uid.trim() || null,
        },
        { onConflict: "profile_id,game" }
      );
      if (accountError) {
        console.warn("Could not sync game account from onboarding:", accountError);
        // Non-fatal: profile was saved; account list can be fixed later
      }

      setSavedGames((current) => new Set(current).add(game));
      showNotice(`${meta.short} profile saved.`, "success");
    } catch (error) {
      showNotice(
        error instanceof Error ? error.message : "Could not save game profile.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  async function continueFromStep3() {
    const missing = selectedGames.filter(
      (game) => !savedGames.has(game) || !draftIsComplete(game)
    );
    if (missing.length > 0) {
      return showNotice(
        `Save a profile for every selected game before continuing. Missing: ${missing
          .map((game) => GAMES[game].short)
          .join(", ")}`,
        "error"
      );
    }
    goToStep(4);
  }

  // ---------- STEP 4 ----------
  async function connectProvider(provider: "discord" | "tiktok") {
    setBusy(true);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: provider === "tiktok" ? "custom:tiktok" : "discord",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });
      if (error) throw error;
      // On success the browser navigates away to the provider's OAuth page.
    } catch (error) {
      showNotice(
        error instanceof Error
          ? error.message
          : `Could not start ${provider === "tiktok" ? "TikTok" : "Discord"} connection. You can also connect it from Account settings.`,
        "error"
      );
      setBusy(false);
    }
  }

  // ---------- STEP 5 ----------
  async function markHqJoined() {
    setBusy(true);
    try {
      await saveProfile({ r3ign_hq_joined: true });
      setHqJoined(true);
      showNotice("R3IGN HQ marked as joined.", "success");
    } catch (error) {
      showNotice(
        error instanceof Error ? error.message : "Could not update status.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  // ---------- STEP 6 ----------
  function calcCompletion() {
    const items: { id: string; label: string; done: boolean; optional?: boolean }[] = [];
    let done = 0;
    const push = (id: string, label: string, isDone: boolean, optional = false) => {
      items.push({ id, label, done: isDone, optional });
      if (isDone && !optional) done += 1;
    };

    push("basic", "Basic Profile", Boolean(displayName.trim() && country));
    push("picture", "Profile Picture", Boolean(avatarUrl));
    push("games", "Games Selected", selectedGames.length > 0);
    for (const game of selectedGames) {
      push(
        `game-${game}`,
        `${GAMES[game].short} Profile`,
        draftIsComplete(game) && savedGames.has(game)
      );
    }
    push("discord", "Discord Connected", discordConnected);
    push("hq", "R3IGN HQ Joined", hqJoined);
    push("tiktok", "TikTok Connected — Optional", tiktokConnected, true);

    const requiredTotal = items.filter((item) => !item.optional).length;
    const percent = requiredTotal === 0 ? 0 : Math.round((done / requiredTotal) * 100);
    return { items, percent, requiredDone: done, requiredTotal };
  }

  async function completeOnboarding() {
    setBusy(true);
    try {
      await saveProfile({ onboarding_completed: true, onboarding_step: 6 });
      // Public player profile: /player/[playerId]
      const dest =
        playerId && playerId.trim()
          ? `/player/${encodeURIComponent(playerId.trim())}`
          : `/player/${encodeURIComponent(initial.userId)}`;
      router.push(dest);
      router.refresh();
    } catch (error) {
      showNotice(
        error instanceof Error ? error.message : "Could not finalize profile.",
        "error"
      );
      setBusy(false);
    }
  }

  const completion = calcCompletion();

  return (
    <>
      <div className="ob-progress" aria-label="Onboarding progress">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="ob-progress-segment">
            {n > 1 && <div className="ob-step-line" />}
            <div
              className={`ob-step${n < step ? " is-done" : ""}${
                n === step ? " is-current" : ""
              }`}
            >
              <span className="ob-step-num">{n}</span>
            </div>
          </div>
        ))}
      </div>

      {notice && (
        <p className={`ob-notice is-${notice.kind}`} role="status">
          {notice.text}
        </p>
      )}

      {step === 1 && (
        <section className="ob-panel">
          <h2 className="ob-panel-title">Basic Profile</h2>
          <p className="ob-panel-sub">
            Who you are on R3IGN. Display name and country are required.
          </p>
          <div className="ob-fields">
            <div className="ob-field">
              <label>
                Profile Picture{" "}
                <span className="optional">(optional now — required for 100%)</span>
              </label>
              <AvatarUploader
                profileId={initial.userId}
                avatarUrl={avatarUrl}
                displayName={displayName}
                onAvatarChange={(url) => setAvatarUrl(url)}
              />
            </div>
            <div className="ob-field">
              <label htmlFor="ob-display-name">Display Name</label>
              <input
                id="ob-display-name"
                value={displayName}
                maxLength={40}
                autoComplete="nickname"
                placeholder="Your competitive name"
                onChange={(event) => setDisplayName(event.currentTarget.value)}
              />
            </div>
            <div className="ob-field">
              <label htmlFor="ob-country">Country / Region</label>
              <select
                id="ob-country"
                value={country}
                onChange={(event) => setCountry(event.currentTarget.value)}
              >
                <option value="">Select country</option>
                {countryOptions.map(({ code, name }) => (
                  <option key={code} value={name}>
                    {countryFlag(code)} {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="ob-field">
              <label>Player ID</label>
              <div className="ob-player-id">{initial.playerId || "R3N-…"}</div>
              <p className="hint">Auto-generated · cannot be changed</p>
            </div>
            <div className="ob-field">
              <label htmlFor="ob-bio">
                Bio <span className="optional">(optional)</span>
              </label>
              <textarea
                id="ob-bio"
                value={bio}
                maxLength={400}
                rows={3}
                placeholder="Tell the R3IGN community about yourself..."
                onChange={(event) => setBio(event.currentTarget.value)}
              />
              <span className="hint">{bio.length}/400</span>
            </div>
          </div>
          <div className="ob-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={continueFromStep1}
              disabled={busy}
            >
              {busy ? "Saving…" : "Continue →"}
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="ob-panel">
          <h2 className="ob-panel-title">What games do you compete in?</h2>
          <p className="ob-panel-sub">
            Select the games you currently play competitively or intend to
            participate in through R3IGN.
          </p>
          <div className="ob-games-list" role="group" aria-label="Game selection">
            {GAME_ORDER.map((game) => (
              <label
                key={game}
                className={`ob-game-card${
                  selectedGames.includes(game) ? " is-selected" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedGames.includes(game)}
                  onChange={() => toggleGame(game)}
                />
                <span className="ob-game-label">{GAMES[game].label}</span>
              </label>
            ))}
          </div>
          <div className="ob-actions">
            <button type="button" className="btn btn-ghost" onClick={() => goToStep(1)}>
              ← Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={continueFromStep2}
              disabled={busy}
            >
              {busy ? "Saving…" : "Continue →"}
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="ob-panel">
          <h2 className="ob-panel-title">Game Profiles</h2>
          <p className="ob-panel-sub">
            Fill in details for each game you selected. Save each form before
            continuing.
          </p>
          {selectedGames.length === 0 ? (
            <p className="ob-empty">
              No games selected. Go back to Step 2 and choose at least one game.
            </p>
          ) : (
            selectedGames.map((game) => {
              const meta = GAMES[game];
              const draft = drafts[game];
              const saved = savedGames.has(game) && draftIsComplete(game);
              return (
                <div className="ob-game-form" key={game} data-game={game}>
                  <div className="ob-game-form-head">
                    <h3>{meta.label}</h3>
                    {saved && <span className="ob-saved-tag">✓ Saved</span>}
                  </div>
                  <div className="ob-fields">
                    <div className="ob-field">
                      <label htmlFor={`ign-${game}`}>In-Game Name / IGN</label>
                      <input
                        id={`ign-${game}`}
                        value={draft.ign}
                        autoComplete="off"
                        onChange={(event) =>
                          updateDraft(game, { ign: event.currentTarget.value })
                        }
                      />
                    </div>
                    <div className="ob-field">
                      <label htmlFor={`uid-${game}`}>Player UID</label>
                      <input
                        id={`uid-${game}`}
                        value={draft.player_uid}
                        autoComplete="off"
                        onChange={(event) =>
                          updateDraft(game, { player_uid: event.currentTarget.value })
                        }
                      />
                    </div>
                    <div className="ob-field">
                      <label htmlFor={`country-${game}`}>Country / Region</label>
                      <select
                        id={`country-${game}`}
                        value={draft.country}
                        onChange={(event) =>
                          updateDraft(game, { country: event.currentTarget.value })
                        }
                      >
                        <option value="">Select country</option>
                        {countryOptions.map(({ code, name }) => (
                          <option key={code} value={name}>
                            {countryFlag(code)} {name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="ob-field">
                      <label htmlFor={`role-${game}`}>
                        {meta.hasExperience ? "Competitive Role" : "Preferred Role"}
                      </label>
                      <select
                        id={`role-${game}`}
                        value={draft.role}
                        onChange={(event) =>
                          updateDraft(game, { role: event.currentTarget.value })
                        }
                      >
                        <option value="">Select role</option>
                        {meta.roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="ob-field">
                      <label htmlFor={`team-${game}`}>
                        {meta.teamLabel} <span className="optional">(optional)</span>
                      </label>
                      <input
                        id={`team-${game}`}
                        value={draft.team_clan}
                        autoComplete="off"
                        onChange={(event) =>
                          updateDraft(game, { team_clan: event.currentTarget.value })
                        }
                      />
                    </div>
                    {meta.hasExperience && (
                      <fieldset className="ob-fieldset">
                        <legend>Competitive Experience</legend>
                        <div className="ob-radio-row">
                          {["Beginner", "Intermediate", "Advanced"].map((level) => (
                            <label className="ob-radio" key={level}>
                              <input
                                type="radio"
                                name={`exp-${game}`}
                                checked={draft.experience === level}
                                onChange={() =>
                                  updateDraft(game, { experience: level })
                                }
                              />
                              <span>{level}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    )}
                  </div>
                  <div className="ob-form-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => saveGame(game)}
                      disabled={busy}
                    >
                      Save {meta.short} Profile
                    </button>
                  </div>
                </div>
              );
            })
          )}
          <div className="ob-actions">
            <button type="button" className="btn btn-ghost" onClick={() => goToStep(2)}>
              ← Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={continueFromStep3}
              disabled={busy}
            >
              Continue →
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="ob-panel">
          <h2 className="ob-panel-title">Connections</h2>
          <p className="ob-panel-sub">
            Link the accounts you use. Socials stay separate from game profiles.
          </p>
          <div className="ob-connections-list">
            <div className="ob-conn-row">
              <div className="ob-conn-info">
                <span className="ob-conn-name">Discord</span>
              </div>
              <div className="ob-conn-action">
                {discordConnected ? (
                  <span className="ob-conn-status is-connected">✓ Discord Connected</span>
                ) : (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => connectProvider("discord")}
                    disabled={busy}
                  >
                    Connect Discord
                  </button>
                )}
              </div>
            </div>
            <div className="ob-conn-row">
              <div className="ob-conn-info">
                <span className="ob-conn-name">TikTok</span>
              </div>
              <div className="ob-conn-action">
                {tiktokConnected ? (
                  <span className="ob-conn-status is-connected">✓ TikTok Connected</span>
                ) : (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => connectProvider("tiktok")}
                    disabled={busy}
                  >
                    Connect TikTok
                  </button>
                )}
              </div>
            </div>
            <div className="ob-conn-row">
              <div className="ob-conn-info">
                <span className="ob-conn-name">Google</span>
              </div>
              <div className="ob-conn-action">
                <span className="ob-conn-status is-connected">✓ Connected</span>
              </div>
            </div>
          </div>
          <div className="ob-actions">
            <button type="button" className="btn btn-ghost" onClick={() => goToStep(3)}>
              ← Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => goToStep(5)}
              disabled={busy}
            >
              Continue →
            </button>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="ob-panel">
          <h2 className="ob-panel-title">Join R3IGN HQ</h2>
          <p className="ob-panel-sub">
            Get league announcements, community updates, registration windows,
            and competition news.
          </p>
          <div className="ob-hq-box">
            <p>
              Join the official R3IGN Headquarters to receive league
              announcements, community updates, registration information and
              competition news.
            </p>
            {hqJoined ? (
              <p className="ob-hq-status">✓ R3IGN HQ CONNECTED</p>
            ) : (
              <>
                <a
                  className="btn btn-primary"
                  href={HQ_INVITE}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join R3IGN HQ
                </a>
                <button
                  type="button"
                  className="btn"
                  onClick={markHqJoined}
                  disabled={busy}
                >
                  I've joined — mark as connected
                </button>
              </>
            )}
          </div>
          <div className="ob-actions">
            <button type="button" className="btn btn-ghost" onClick={() => goToStep(4)}>
              ← Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => goToStep(6)}
              disabled={busy}
            >
              Continue →
            </button>
          </div>
        </section>
      )}

      {step === 6 && (
        <section className="ob-panel">
          <div className="ob-completion-head">
            <h2 className="ob-panel-title">Your R3IGN Profile</h2>
            <div className="ob-percent">
              Profile Completion: <span>{completion.percent}%</span>
            </div>
          </div>
          <ul className="ob-checklist">
            {completion.items.map((item) => (
              <li
                key={item.id}
                className={`ob-check-item${item.done ? " is-done" : " is-pending"}${
                  item.optional ? " is-optional" : ""
                }`}
              >
                <span className="ob-check-icon">{item.done ? "✓" : "○"}</span>{" "}
                {item.label}
              </li>
            ))}
          </ul>
          <div className="ob-actions">
            <button type="button" className="btn btn-ghost" onClick={() => goToStep(5)}>
              ← Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={completeOnboarding}
              disabled={busy}
            >
              {busy ? "Finishing…" : "Complete Profile"}
            </button>
          </div>
        </section>
      )}
    </>
  );
}