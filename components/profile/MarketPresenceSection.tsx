"use client";

import Link from "next/link";
import { useState } from "react";
import { useR3ignDialog } from "@/components/R3ignDialog";
import { createClient } from "@/lib/supabase/client";
import ProfileSection, { SectionLoadError } from "./ProfileSection";
import type { PlayerListing } from "./account-types";

type Props = {
  mode?: "account" | "public";
  profileId: string;
  listings: PlayerListing[];
  publicListings?: PublicPlayerListing[];
  loadError?: string;
};

type PublicPlayerListing = Pick<
  PlayerListing,
  "id" | "ign" | "role" | "league" | "status"
>;

function statusBadge(status: string | null) {
  if (status === "closed" || status === "cancelled") {
    return "is-inactive";
  }
  return "is-verified";
}

export default function MarketPresenceSection({
  mode = "account",
  profileId,
  listings: initialListings,
  publicListings = [],
  loadError,
}: Props) {
  const supabase = createClient();
  const { confirm } = useR3ignDialog();
  const [listings, setListings] = useState(initialListings);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeListing = listings.find((listing) => listing.status === "active");
  const publicActiveListing = publicListings.find(
    (listing) => listing.status === "active"
  );

  async function removeListing(listing: PlayerListing) {
    const confirmed = await confirm({
      title: "Delete player listing",
      message: "Delete this player listing?",
      confirmLabel: "Delete listing",
      variant: "danger",
    });

    if (!confirmed || savingId) return;

    const previous = listings;
    setSavingId(listing.id);
    setListings((current) => current.filter((row) => row.id !== listing.id));
    setError("");
    setSuccess("");

    try {
      const { error: deleteError } = await supabase
        .from("player_listings")
        .delete()
        .eq("id", listing.id)
        .eq("profile_id", profileId);

      if (deleteError) throw deleteError;
      setSuccess("Listing deleted.");
    } catch (deleteError: unknown) {
      setListings(previous);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete this listing."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function reactivateListing(listing: PlayerListing) {
    setSavingId(listing.id);
    setError("");
    setSuccess("");
    const previous = listings;
    setListings((current) =>
      current.map((row) =>
        row.id === listing.id ? { ...row, status: "active" } : row
      )
    );

    try {
      const { error: updateError } = await supabase
        .from("player_listings")
        .update({ status: "active" })
        .eq("id", listing.id)
        .eq("profile_id", profileId);

      if (updateError) throw updateError;
      setSuccess("Listing reactivated.");
    } catch (updateError: unknown) {
      setListings(previous);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not reactivate this listing."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <ProfileSection icon="◫" title="Market presence">
      <SectionLoadError message={loadError} />
      {mode === "public" && publicActiveListing ? (
        <div className="profile-market-row">
          <div>
            <strong>{publicActiveListing.league || "League"}</strong>
            <span className="profile-muted">
              {publicActiveListing.role || "Open role"} ·{" "}
              {publicActiveListing.ign || "Player"}
            </span>
          </div>
          <span className="profile-status-badge is-verified">Active</span>
          <Link href="/player-market" className="btn btn-ghost">
            View listing
          </Link>
        </div>
      ) : mode === "public" ? null : activeListing ? (
        <div className="profile-market-row">
          <div>
            <strong>{activeListing.league || "League"}</strong>
            <span className="profile-muted">
              {activeListing.role || "Open role"} · {activeListing.ign || "Player"}
            </span>
          </div>
          <span className={`profile-status-badge ${statusBadge(activeListing.status)}`}>
            {activeListing.status ?? "active"}
          </span>
          <div className="profile-row-actions">
            <button type="button" className="btn btn-ghost" disabled>
              Edit listing
            </button>
            <button
              type="button"
              className="btn btn-ghost profile-danger-action"
              onClick={() => removeListing(activeListing)}
              disabled={savingId === activeListing.id}
            >
              {savingId === activeListing.id ? "Deleting…" : "Delete listing"}
            </button>
          </div>
        </div>
      ) : listings.length > 0 ? (
        <div className="profile-market-row">
          <div>
            <strong>Listing inactive</strong>
            <span className="profile-muted">
              {listings[0].status === "closed"
                ? "Closed listing"
                : listings[0].status === "cancelled"
                  ? "Cancelled listing"
                  : "No active listing"}
            </span>
          </div>
          <span className="profile-status-badge is-inactive">
            {listings[0].status ?? "inactive"}
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => reactivateListing(listings[0])}
            disabled={savingId === listings[0].id}
          >
            {savingId === listings[0].id ? "Reactivating…" : "Reactivate"}
          </button>
        </div>
      ) : (
        <div className="profile-empty-state">
          <p>Create a player listing to start attracting teams.</p>
        </div>
      )}

      {error && <p className="profile-inline-error" role="alert">{error}</p>}
      {success && (
        <p className="profile-inline-success" role="status">{success}</p>
      )}
    </ProfileSection>
  );
}
