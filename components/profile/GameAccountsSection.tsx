"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useR3ignDialog } from "@/components/R3ignDialog";
import { createClient } from "@/lib/supabase/client";
import ProfileSection, { SectionLoadError } from "./ProfileSection";
import type {
  GameAccount,
  GameProfile,
  PublicGameAccount,
} from "./account-types";

type Props = {
  mode?: "account" | "public";
  profileId: string;
  accounts: GameAccount[];
  publicAccounts?: PublicGameAccount[];
  gameProfiles: GameProfile[];
  loadError?: string;
};

const GAMES = [
  { id: "rcml", league: "RCML", name: "Call of Duty: Mobile" },
  { id: "rfcl", league: "RFCL", name: "Free Fire" },
  { id: "rbsl", league: "RBSL", name: "Blood Strike" },
] as const;

type GameId = (typeof GAMES)[number]["id"];
type GameFormValues = Record<GameId, { ign: string; uid: string }>;

const emptyValues = (): GameFormValues => ({
  rcml: { ign: "", uid: "" },
  rfcl: { ign: "", uid: "" },
  rbsl: { ign: "", uid: "" },
});

function statusClass(status: string) {
  if (status === "verified") return "is-verified";
  if (status === "rejected") return "is-rejected";
  return "is-pending";
}

export default function GameAccountsSection({
  mode = "account",
  profileId,
  accounts: initialAccounts,
  publicAccounts = [],
  gameProfiles,
  loadError,
}: Props) {
  const supabase = createClient();
  const { confirm } = useR3ignDialog();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [showForm, setShowForm] = useState(false);
  const [selectedGames, setSelectedGames] = useState<GameId[]>([]);
  const [values, setValues] = useState<GameFormValues>(emptyValues);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const profilesByGame = useMemo(
    () => new Map(gameProfiles.map((row) => [row.game, row])),
    [gameProfiles]
  );
  const displayAccounts =
    mode === "public"
      ? publicAccounts.map((account, index) => ({
          id: `${account.game}-${index}`,
          game: account.game,
          ign: account.ign ?? "",
          game_uid: account.game_uid,
          verification_status: account.verification_status ?? "pending",
          verification_code: null,
          team_clan: null,
        }))
      : accounts.map((account) => ({
          id: account.id,
          game: account.game,
          ign: account.ign,
          game_uid: account.game_uid,
          verification_status: account.verification_status,
          verification_code: account.verification_code,
          team_clan: profilesByGame.get(account.game)?.team_clan ?? null,
        }));

  useEffect(() => {
    if (!showForm) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) setShowForm(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showForm, saving]);

  function openForm(account?: GameAccount) {
    setError("");
    setSuccess("");
    const nextValues = emptyValues();
    const nextSelected: GameId[] = [];
    if (account && GAMES.some((game) => game.id === account.game)) {
      const gameId = account.game as GameId;
      nextSelected.push(gameId);
      nextValues[gameId] = {
        ign: account.ign,
        uid: account.game_uid ?? "",
      };
    }
    setValues(nextValues);
    setSelectedGames(nextSelected);
    setShowForm(true);
  }

  function updateValue(game: GameId, field: "ign" | "uid", value: string) {
    setValues((current) => ({
      ...current,
      [game]: { ...current[game], [field]: value },
    }));
  }

  async function saveAccounts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rows = selectedGames
      .map((game) => ({
        profile_id: profileId,
        game,
        ign: values[game].ign.trim(),
        game_uid: values[game].uid.trim() || null,
      }))
      .filter((row) => row.ign);

    if (rows.length === 0) {
      setError("Select at least one game and enter an in-game name.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const { data, error: upsertError } = await supabase
        .from("game_accounts")
        .upsert(rows, { onConflict: "profile_id,game" })
        .select(
          "id,game,ign,game_uid,verification_status,verification_code,updated_at"
        );
      if (upsertError) throw upsertError;

      const updated = new Map((data ?? []).map((row) => [row.game, row]));
      setAccounts((current) => {
        const next = current.filter((account) => !updated.has(account.game));
        return [...next, ...updated.values()].sort((a, b) =>
          a.game.localeCompare(b.game)
        );
      });
      setSuccess("Game accounts saved. New or changed accounts are pending review.");
      setShowForm(false);
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save game accounts."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount(account: GameAccount) {
    const confirmed = await confirm({
      title: "Delete game account",
      message: `Remove ${account.ign} from your linked game accounts?`,
      confirmLabel: "Delete account",
      variant: "danger",
    });
    if (!confirmed || deletingId) return;

    const previous = accounts;
    setDeletingId(account.id);
    setError("");
    setSuccess("");
    setAccounts((current) => current.filter((row) => row.id !== account.id));
    try {
      const { error: deleteError } = await supabase
        .from("game_accounts")
        .delete()
        .eq("id", account.id)
        .eq("profile_id", profileId);
      if (deleteError) throw deleteError;
      setSuccess("Game account removed.");
    } catch (deleteError: unknown) {
      setAccounts(previous);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete this game account."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ProfileSection
      icon="⌖"
      title="Game accounts"
      action={mode === "account" ? (
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => openForm()}
        >
          Add game account
        </button>
      ) : undefined}
    >
      <SectionLoadError message={loadError} />
      {error && !showForm && (
        <p className="profile-inline-error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="profile-inline-success" role="status">{success}</p>}

      {displayAccounts.length ? (
        <div className="profile-game-account-list">
          {displayAccounts.map((account) => {
            const game = GAMES.find((item) => item.id === account.game);
            return (
              <article className="profile-game-account" key={account.id}>
                <div className="profile-game-account-main">
                  <div>
                    <span className="profile-kicker">
                      {game?.league ?? account.game.toUpperCase()} ·{" "}
                      {game?.name ?? "Game"}
                    </span>
                    <h3>{account.ign}</h3>
                    <p>UID: {account.game_uid || "Not provided"}</p>
                  </div>
                  <span
                    className={`profile-status-badge ${statusClass(account.verification_status)}`}
                  >
                    {account.verification_status}
                  </span>
                </div>
                {mode === "account" && account.verification_code &&
                  account.verification_status !== "verified" && (
                    <p className="profile-game-verification-code">
                      Verification code: <code>{account.verification_code}</code>
                      . An administrator will check this against your in-game profile.
                    </p>
                  )}
                {account.team_clan && (
                  <p className="profile-team-clan">
                    Team / clan: <strong>{account.team_clan}</strong>
                    <span>Teams are managed via the roster system.</span>
                  </p>
                )}
                {mode === "account" && (
                  <div className="profile-row-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() =>
                        openForm(accounts.find((row) => row.id === account.id))
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost profile-danger-action"
                      onClick={() => {
                        const existingAccount = accounts.find(
                          (row) => row.id === account.id
                        );
                        if (existingAccount) void deleteAccount(existingAccount);
                      }}
                      disabled={deletingId === account.id}
                    >
                      {deletingId === account.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : !loadError ? (
        <p className="profile-empty-state">
          No game accounts linked yet. Add the accounts used in your R3IGN leagues.
        </p>
      ) : null}

      {showForm && (
        <div
          className="profile-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowForm(false);
            }
          }}
        >
          <section
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-account-modal-title"
          >
            <div className="profile-modal-heading">
              <div>
                <span className="profile-kicker">Player setup</span>
                <h2 id="game-account-modal-title">Link game accounts</h2>
              </div>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setShowForm(false)}
                disabled={saving}
                aria-label="Close game account form"
              >
                ×
              </button>
            </div>
            <p className="profile-muted">
              Select the games you play and add your in-game name. League staff
              review each submission; verification is not automatic.
            </p>
            <form onSubmit={saveAccounts}>
              <div className="profile-game-picker">
                {GAMES.map((game) => {
                  const checked = selectedGames.includes(game.id);
                  return (
                    <label key={game.id} className="profile-game-picker-item">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          setSelectedGames((current) =>
                            event.currentTarget.checked
                              ? [...current, game.id]
                              : current.filter((id) => id !== game.id)
                          );
                        }}
                      />
                      <span>
                        <strong>{game.league}</strong>
                        {game.name}
                      </span>
                    </label>
                  );
                })}
              </div>
              {selectedGames.map((gameId) => {
                const game = GAMES.find((item) => item.id === gameId);
                if (!game) return null;
                return (
                  <fieldset className="profile-game-form-fields" key={gameId}>
                    <legend>{game.league} · {game.name}</legend>
                    <label>
                      In-game name
                      <input
                        autoFocus={selectedGames[0] === gameId}
                        required
                        value={values[gameId].ign}
                        onChange={(event) =>
                          updateValue(gameId, "ign", event.currentTarget.value)
                        }
                        maxLength={80}
                      />
                    </label>
                    <label>
                      Player UID <span className="profile-muted">(optional)</span>
                      <input
                        value={values[gameId].uid}
                        onChange={(event) =>
                          updateValue(gameId, "uid", event.currentTarget.value)
                        }
                        maxLength={100}
                      />
                    </label>
                  </fieldset>
                );
              })}
              {error && (
                <p className="profile-inline-error" role="alert">
                  {error}
                </p>
              )}
              <div className="profile-modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save game accounts"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </ProfileSection>
  );
}
