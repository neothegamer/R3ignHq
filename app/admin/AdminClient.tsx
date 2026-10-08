"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useR3ignDialog } from "@/components/R3ignDialog";

type Tab =
  | "registrations"
  | "verifications"
  | "events"
  | "news"
  | "awards"
  | "highlights"
  | "admins";

type Registration = {
  id: string;
  team_name: string;
  team_tag: string;
  league: string;
  captain_name: string;
  captain_email: string;
  discord: string | null;
  region: string | null;
  roster: string;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string | null;
};

type GameAccount = {
  id: string;
  profile_id: string;
  game: string;
  ign: string;
  game_uid: string | null;
  verification_status: "unverified" | "pending" | "verified" | "rejected";
  verification_code: string | null;
  updated_at: string | null;
  profile: ProfileInfo | ProfileInfo[] | null;
};

type ProfileInfo = {
  display_name: string | null;
  league_id: string | null;
  player_id: string | null;
};

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  league: string | null;
  location: string | null;
  start_time: string;
  end_time: string | null;
  ended_at: string | null;
};

type NewsPost = {
  id: string;
  title: string;
  body: string;
  category: string;
  author_name: string | null;
  published: boolean;
  created_at: string;
};

type AwardWinner = {
  id: string;
  award_label: string;
  player_name: string;
  context: string | null;
  season: string | null;
  created_at: string;
};

type Highlight = {
  id: string;
  title: string;
  description: string | null;
  league: string | null;
  match_label: string | null;
  video_url: string | null;
  storage_path: string | null;
  created_at: string | null;
};

type AdminUser = {
  profile_id: string;
  created_at: string | null;
  profile: ProfileInfo | ProfileInfo[] | null;
};

type ProfileMatch = {
  id: string;
  display_name: string | null;
  league_id: string | null;
  player_id: string | null;
};

type Draft = {
  id?: string;
  title: string;
  body: string;
  category: string;
  author_name: string;
  published: boolean;
  award_label: string;
  player_name: string;
  context: string;
  season: string;
  description: string;
  league: string;
  match_label: string;
  video_url: string;
  storage_path: string;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "registrations", label: "Registrations" },
  { id: "verifications", label: "Game Verifications" },
  { id: "events", label: "Events" },
  { id: "news", label: "News" },
  { id: "awards", label: "Awards" },
  { id: "highlights", label: "Highlights" },
  { id: "admins", label: "Manage Admins" },
];

const EMPTY_DRAFT: Draft = {
  title: "",
  body: "",
  category: "Announcement",
  author_name: "",
  published: true,
  award_label: "MVP",
  player_name: "",
  context: "",
  season: "",
  description: "",
  league: "",
  match_label: "",
  video_url: "",
  storage_path: "",
};

function dateLabel(value: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString();
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The request could not be completed.";
}

function profileInfo(profile: ProfileInfo | ProfileInfo[] | null) {
  return Array.isArray(profile) ? profile[0] ?? null : profile;
}

export default function AdminClient() {
  const supabase = useMemo(() => createClient(), []);
  const { confirm } = useR3ignDialog();
  const [activeTab, setActiveTab] = useState<Tab>("registrations");
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState<Partial<Record<Tab, string>>>(
    {}
  );
  const [notice, setNotice] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [gameAccounts, setGameAccounts] = useState<GameAccount[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [awards, setAwards] = useState<AwardWinner[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editing, setEditing] = useState(false);
  const [lookupValue, setLookupValue] = useState("");
  const [profileMatch, setProfileMatch] = useState<ProfileMatch | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [
      registrationResult,
      gameAccountResult,
      eventResult,
      newsResult,
      awardResult,
      highlightResult,
      adminResult,
      authResult,
    ] = await Promise.all([
      supabase
        .from("registrations")
        .select(
          "id,team_name,team_tag,league,captain_name,captain_email,discord,region,roster,notes,status,created_at"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("game_accounts")
        .select(
          "id,profile_id,game,ign,game_uid,verification_status,verification_code,updated_at,profile:profiles(display_name,league_id,player_id)"
        )
        .order("updated_at", { ascending: false }),
      supabase
        .from("events")
        .select(
          "id,title,description,league,location,start_time,end_time,ended_at"
        )
        .order("start_time", { ascending: true }),
      supabase
        .from("news_posts")
        .select("id,title,body,category,author_name,published,created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("award_winners")
        .select("id,award_label,player_name,context,season,created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("match_highlights")
        .select(
          "id,title,description,league,match_label,video_url,storage_path,created_at"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("admins")
        .select(
          "profile_id,created_at,profile:profiles(display_name,league_id,player_id)"
        )
        .order("created_at", { ascending: true }),
      supabase.auth.getUser(),
    ]);

    setRegistrations((registrationResult.data as Registration[] | null) ?? []);
    setGameAccounts((gameAccountResult.data as GameAccount[] | null) ?? []);
    setEvents((eventResult.data as EventRow[] | null) ?? []);
    setNews((newsResult.data as NewsPost[] | null) ?? []);
    setAwards((awardResult.data as AwardWinner[] | null) ?? []);
    setHighlights((highlightResult.data as Highlight[] | null) ?? []);
    setAdmins((adminResult.data as AdminUser[] | null) ?? []);
    setUserId(authResult.data.user?.id ?? null);

    const errors: Partial<Record<Tab, string>> = {};
    if (registrationResult.error) errors.registrations = registrationResult.error.message;
    if (gameAccountResult.error) errors.verifications = gameAccountResult.error.message;
    if (eventResult.error) errors.events = eventResult.error.message;
    if (newsResult.error) errors.news = newsResult.error.message;
    if (awardResult.error) errors.awards = awardResult.error.message;
    if (highlightResult.error) errors.highlights = highlightResult.error.message;
    if (adminResult.error) errors.admins = adminResult.error.message;
    if (authResult.error) {
      setNotice({ kind: "error", text: authResult.error.message });
    }
    setLoadErrors(errors);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const counts = useMemo(() => {
    const now = Date.now();
    return {
      registrations: registrations.filter((row) => row.status === "pending")
        .length,
      verifications: gameAccounts.filter(
        (row) => row.verification_status === "pending"
      ).length,
      events: events.filter(
        (row) => !row.ended_at && new Date(row.start_time).getTime() <= now
      ).length,
      news: news.filter((row) => !row.published).length,
      awards: 0,
      highlights: 0,
      admins: 0,
    };
  }, [registrations, gameAccounts, events, news]);

  async function runConfirmed(message: string, work: () => Promise<void>) {
    if (!(await confirm({ title: "Confirm admin action", message }))) return;
    setBusy(true);
    setNotice(null);
    try {
      await work();
      setNotice({ kind: "success", text: "Changes saved." });
    } catch (error: unknown) {
      setNotice({ kind: "error", text: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  function changeRegistrationStatus(
    row: Registration,
    status: Registration["status"]
  ) {
    const previous = registrations;
    void runConfirmed(
      `${status === "approved" ? "Approve" : "Reject"} registration for ${row.team_name}?`,
      async () => {
        setRegistrations((items) =>
          items.map((item) => (item.id === row.id ? { ...item, status } : item))
        );
        const { error } = await supabase
          .from("registrations")
          .update({ status })
          .eq("id", row.id)
          .select("id")
          .single();
        if (error) {
          setRegistrations(previous);
          throw error;
        }
      }
    );
  }

  function changeVerification(row: GameAccount, status: "verified" | "rejected") {
    const previous = gameAccounts;
    void runConfirmed(
      `${status === "verified" ? "Verify" : "Reject"} ${row.ign}'s ${row.game} account?`,
      async () => {
        setGameAccounts((items) =>
          items.map((item) =>
            item.id === row.id
              ? { ...item, verification_status: status }
              : item
          )
        );
        const { error } = await supabase
          .from("game_accounts")
          .update({ verification_status: status })
          .eq("id", row.id)
          .select("id")
          .single();
        if (error) {
          setGameAccounts(previous);
          throw error;
        }
      }
    );
  }

  function endEvent(row: EventRow) {
    const previous = events;
    const endedAt = new Date().toISOString();
    void runConfirmed(`Mark "${row.title}" as ended?`, async () => {
      setEvents((items) =>
        items.map((item) =>
          item.id === row.id ? { ...item, ended_at: endedAt } : item
        )
      );
      const { error } = await supabase
        .from("events")
        .update({ ended_at: endedAt })
        .eq("id", row.id)
        .select("id")
        .single();
      if (error) {
        setEvents(previous);
        throw error;
      }
    });
  }

  async function findProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLookingUp(true);
    setLookupError(null);
    setProfileMatch(null);
    const playerId = lookupValue.trim().toUpperCase();
    if (!/^(?:R3N-?\d{6}|R3E\d{6})$/.test(playerId)) {
      setLookupError("Enter a valid Player ID in the format R3N-######.");
      setLookingUp(false);
      return;
    }
    let result = await supabase
      .from("profiles")
      .select("id,display_name,league_id,player_id")
      .eq("player_id", playerId)
      .maybeSingle();
    if (!result.error && !result.data) {
      result = await supabase
        .from("profiles")
        .select("id,display_name,league_id,player_id")
        .eq("league_id", playerId)
        .maybeSingle();
    }
    const { data, error } = result;
    if (error) setLookupError(error.message);
    else if (!data) setLookupError("No player was found with that Player ID.");
    else {
      const match = data as ProfileMatch;
      if (admins.some((admin) => admin.profile_id === match.id)) {
        setLookupError("That player is already an administrator.");
      } else {
        setProfileMatch(match);
      }
    }
    setLookingUp(false);
  }

  function promoteAdmin() {
    if (!profileMatch) return;
    const match = profileMatch;
    const temp: AdminUser = {
      profile_id: match.id,
      created_at: new Date().toISOString(),
      profile: {
        display_name: match.display_name,
        league_id: match.league_id,
        player_id: match.player_id,
      },
    };
    const previous = admins;
    void runConfirmed(
      `Promote ${match.display_name || match.player_id || match.league_id || "this player"} to administrator?`,
      async () => {
        setAdmins((items) => [...items, temp]);
        const { data, error } = await supabase
          .from("admins")
          .insert({ profile_id: match.id })
          .select(
            "profile_id,created_at,profile:profiles(display_name,league_id,player_id)"
          )
          .single();
        if (error) {
          setAdmins(previous);
          throw error;
        }
        const added: AdminUser = {
          profile_id: data.profile_id,
          created_at: data.created_at,
          profile: Array.isArray(data.profile)
            ? data.profile[0] ?? null
            : data.profile,
        };
        setAdmins((items) =>
          items.map((item) =>
            item.profile_id === match.id ? added : item
          )
        );
        setProfileMatch(null);
        setLookupValue("");
      }
    );
  }

  function removeAdmin(row: AdminUser) {
    if (admins.length <= 1) {
      setNotice({
        kind: "error",
        text: "The last administrator cannot be removed.",
      });
      return;
    }
    const previous = admins;
    const profile = profileInfo(row.profile);
    const name =
      profile?.display_name ||
      profile?.player_id ||
      profile?.league_id ||
      row.profile_id;
    void runConfirmed(`Remove ${name} as an administrator?`, async () => {
      setAdmins((items) =>
        items.filter((item) => item.profile_id !== row.profile_id)
      );
      const { error } = await supabase
        .from("admins")
        .delete()
        .eq("profile_id", row.profile_id)
        .select("profile_id")
        .single();
      if (error) {
        setAdmins(previous);
        throw error;
      }
    });
  }

  function startCreate() {
    setDraft(EMPTY_DRAFT);
    setEditing(false);
  }

  function startEdit(row: NewsPost | AwardWinner | Highlight) {
    if ("body" in row) {
      setDraft({
        ...EMPTY_DRAFT,
        id: row.id,
        title: row.title,
        body: row.body,
        category: row.category,
        author_name: row.author_name ?? "",
        published: row.published,
      });
    } else if ("player_name" in row) {
      setDraft({
        ...EMPTY_DRAFT,
        id: row.id,
        award_label: row.award_label,
        player_name: row.player_name,
        context: row.context ?? "",
        season: row.season ?? "",
      });
    } else {
      setDraft({
        ...EMPTY_DRAFT,
        id: row.id,
        title: row.title,
        description: row.description ?? "",
        league: row.league ?? "",
        match_label: row.match_label ?? "",
        video_url: row.video_url ?? "",
        storage_path: row.storage_path ?? "",
      });
    }
    setEditing(true);
  }

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function submitContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = draft.id;
    const isEdit = Boolean(id);
    const tab = activeTab;

    if (tab === "news" && (!draft.title.trim() || !draft.body.trim())) {
      setNotice({ kind: "error", text: "News title and body are required." });
      return;
    }
    if (tab === "awards" && (!draft.award_label.trim() || !draft.player_name.trim())) {
      setNotice({
        kind: "error",
        text: "Award label and player name are required.",
      });
      return;
    }
    if (tab === "highlights" && !draft.title.trim()) {
      setNotice({ kind: "error", text: "Highlight title is required." });
      return;
    }

    const action = isEdit ? "Update" : "Create";
    const label =
      tab === "news" ? "news post" : tab === "awards" ? "award" : "highlight";
    await runConfirmed(`${action} this ${label}?`, async () => {
      const createdAt = new Date().toISOString();
      if (tab === "news") {
        const payload = {
          title: draft.title.trim(),
          body: draft.body.trim(),
          category: draft.category,
          author_name: draft.author_name.trim() || null,
          published: draft.published,
          ...(isEdit ? {} : { created_by: userId }),
        };
        if (isEdit && id) {
          const previous = news;
          setNews((items) =>
            items.map((item) =>
              item.id === id
                ? { ...item, ...payload, created_at: item.created_at }
                : item
            )
          );
          const { data, error } = await supabase
            .from("news_posts")
            .update(payload)
            .eq("id", id)
            .select("*")
            .single();
          if (error) {
            setNews(previous);
            throw error;
          }
          setNews((items) =>
            items.map((item) => (item.id === id ? (data as NewsPost) : item))
          );
        } else {
          const temp: NewsPost = {
            id: crypto.randomUUID(),
            ...payload,
            created_at: createdAt,
          };
          setNews((items) => [temp, ...items]);
          const { data, error } = await supabase
            .from("news_posts")
            .insert(payload)
            .select("*")
            .single();
          if (error) {
            setNews((items) => items.filter((item) => item.id !== temp.id));
            throw error;
          }
          setNews((items) =>
            items.map((item) => (item.id === temp.id ? (data as NewsPost) : item))
          );
        }
      } else if (tab === "awards") {
        const payload = {
          award_label: draft.award_label.trim(),
          player_name: draft.player_name.trim(),
          context: draft.context.trim() || null,
          season: draft.season.trim() || null,
        };
        if (isEdit && id) {
          const previous = awards;
          setAwards((items) =>
            items.map((item) =>
              item.id === id ? { ...item, ...payload } : item
            )
          );
          const { data, error } = await supabase
            .from("award_winners")
            .update(payload)
            .eq("id", id)
            .select("*")
            .single();
          if (error) {
            setAwards(previous);
            throw error;
          }
          setAwards((items) =>
            items.map((item) =>
              item.id === id ? (data as AwardWinner) : item
            )
          );
        } else {
          const temp: AwardWinner = {
            id: crypto.randomUUID(),
            ...payload,
            created_at: createdAt,
          };
          setAwards((items) => [temp, ...items]);
          const { data, error } = await supabase
            .from("award_winners")
            .insert(payload)
            .select("*")
            .single();
          if (error) {
            setAwards((items) => items.filter((item) => item.id !== temp.id));
            throw error;
          }
          setAwards((items) =>
            items.map((item) =>
              item.id === temp.id ? (data as AwardWinner) : item
            )
          );
        }
      } else if (tab === "highlights") {
        const payload = {
          title: draft.title.trim(),
          description: draft.description.trim() || null,
          league: draft.league || null,
          match_label: draft.match_label.trim() || null,
          video_url: draft.video_url.trim() || null,
          storage_path: draft.storage_path.trim() || null,
          ...(isEdit ? {} : { uploaded_by: userId }),
        };
        if (isEdit && id) {
          const previous = highlights;
          setHighlights((items) =>
            items.map((item) =>
              item.id === id ? { ...item, ...payload } : item
            )
          );
          const { data, error } = await supabase
            .from("match_highlights")
            .update(payload)
            .eq("id", id)
            .select("*")
            .single();
          if (error) {
            setHighlights(previous);
            throw error;
          }
          setHighlights((items) =>
            items.map((item) =>
              item.id === id ? (data as Highlight) : item
            )
          );
        } else {
          const temp: Highlight = {
            id: crypto.randomUUID(),
            ...payload,
            created_at: createdAt,
          };
          setHighlights((items) => [temp, ...items]);
          const { data, error } = await supabase
            .from("match_highlights")
            .insert(payload)
            .select("*")
            .single();
          if (error) {
            setHighlights((items) => items.filter((item) => item.id !== temp.id));
            throw error;
          }
          setHighlights((items) =>
            items.map((item) =>
              item.id === temp.id ? (data as Highlight) : item
            )
          );
        }
      }
      setDraft(EMPTY_DRAFT);
      setEditing(false);
    });
  }

  function deleteContent(row: NewsPost | AwardWinner | Highlight) {
    const tab = activeTab;
    const label =
      tab === "news" ? "news post" : tab === "awards" ? "award" : "highlight";
    void runConfirmed(`Delete this ${label} permanently?`, async () => {
      if (tab === "news") {
        const previous = news;
        setNews((items) => items.filter((item) => item.id !== row.id));
        const { error } = await supabase
          .from("news_posts")
          .delete()
          .eq("id", row.id)
          .select("id")
          .single();
        if (error) {
          setNews(previous);
          throw error;
        }
      } else if (tab === "awards") {
        const previous = awards;
        setAwards((items) => items.filter((item) => item.id !== row.id));
        const { error } = await supabase
          .from("award_winners")
          .delete()
          .eq("id", row.id)
          .select("id")
          .single();
        if (error) {
          setAwards(previous);
          throw error;
        }
      } else if (tab === "highlights") {
        const previous = highlights;
        setHighlights((items) => items.filter((item) => item.id !== row.id));
        const { error } = await supabase
          .from("match_highlights")
          .delete()
          .eq("id", row.id)
          .select("id")
          .single();
        if (error) {
          setHighlights(previous);
          throw error;
        }
      }
      if (draft.id === row.id) {
        setDraft(EMPTY_DRAFT);
        setEditing(false);
      }
    });
  }

  const contentRows: (NewsPost | AwardWinner | Highlight)[] =
    activeTab === "news"
      ? news
      : activeTab === "awards"
        ? awards
        : activeTab === "highlights"
          ? highlights
          : [];

  return (
    <main id="main-content" className="admin-page">
      <div className="page-header">
        <div className="wrap">
          <span className="eyebrow">R3IGN HQ Operations</span>
          <h1>Admin Panel</h1>
          <p>Review submissions and manage league content.</p>
        </div>
      </div>

      <section className="section-tight">
        <div className="wrap">
          {notice && (
            <p
              className={`admin-notice is-${notice.kind}`}
              role={notice.kind === "error" ? "alert" : "status"}
            >
              {notice.text}
            </p>
          )}

          <div className="admin-tabs" role="tablist" aria-label="Admin sections">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`admin-tab${activeTab === tab.id ? " is-active" : ""}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setNotice(null);
                  setDraft(EMPTY_DRAFT);
                  setEditing(false);
                }}
              >
                {tab.label}
                <span className="admin-tab-count">{counts[tab.id]}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <p className="field-hint" role="status">
              Loading admin data…
            </p>
          ) : (
            <div className="admin-panel" role="tabpanel">
              {loadErrors[activeTab] && (
                <p className="admin-notice is-error" role="alert">
                  Could not load this section: {loadErrors[activeTab]}
                </p>
              )}

              {activeTab === "registrations" && (
                <section aria-labelledby="admin-section-heading">
                  <h2 id="admin-section-heading">Team Registrations</h2>
                  {registrations.length === 0 ? (
                    <p className="field-hint">No registrations to review.</p>
                  ) : (
                    <div className="admin-card-list">
                      {registrations.map((row) => (
                        <article className="admin-record" key={row.id}>
                          <div className="admin-record-heading">
                            <div>
                              <span className={`admin-status is-${row.status}`}>
                                {row.status}
                              </span>
                              <h3>
                                {row.team_name}{" "}
                                <span className="admin-muted">[{row.team_tag}]</span>
                              </h3>
                            </div>
                            <span className="admin-record-date">
                              {dateLabel(row.created_at)}
                            </span>
                          </div>
                          <dl className="admin-detail-grid">
                            <div><dt>League</dt><dd>{row.league.toUpperCase()}</dd></div>
                            <div><dt>Captain</dt><dd>{row.captain_name}</dd></div>
                            <div><dt>Email</dt><dd><a href={`mailto:${row.captain_email}`}>{row.captain_email}</a></dd></div>
                            <div><dt>Discord</dt><dd>{row.discord || "—"}</dd></div>
                            <div><dt>Region</dt><dd>{row.region || "—"}</dd></div>
                          </dl>
                          <p><strong>Roster:</strong> {row.roster}</p>
                          {row.notes && <p><strong>Notes:</strong> {row.notes}</p>}
                          {row.status === "pending" && (
                            <div className="admin-actions">
                              <button className="btn btn-primary" disabled={busy} onClick={() => changeRegistrationStatus(row, "approved")}>Approve</button>
                              <button className="btn btn-ghost" disabled={busy} onClick={() => changeRegistrationStatus(row, "rejected")}>Reject</button>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeTab === "verifications" && (
                <section aria-labelledby="admin-section-heading">
                  <h2 id="admin-section-heading">Game Account Verifications</h2>
                  {gameAccounts.filter((row) => row.verification_status === "pending").length === 0 ? (
                    <p className="field-hint">No game accounts are awaiting verification.</p>
                  ) : (
                    <div className="admin-card-list">
                      {gameAccounts.filter((row) => row.verification_status === "pending").map((row) => (
                        <article className="admin-record" key={row.id}>
                          <div className="admin-record-heading">
                            <div>
                              <span className="admin-status is-pending">pending</span>
                              <h3>{row.ign} <span className="admin-muted">· {row.game.toUpperCase()}</span></h3>
                            </div>
                            <span className="admin-record-date">{dateLabel(row.updated_at)}</span>
                          </div>
                          <dl className="admin-detail-grid">
                            <div><dt>Player</dt><dd>{profileInfo(row.profile)?.display_name || "Unknown player"}</dd></div>
                            <div><dt>Player ID</dt><dd>{profileInfo(row.profile)?.player_id || profileInfo(row.profile)?.league_id || "—"}</dd></div>
                            <div><dt>Game UID</dt><dd>{row.game_uid || "—"}</dd></div>
                            <div><dt>Verification code</dt><dd>{row.verification_code || "—"}</dd></div>
                          </dl>
                          <div className="admin-actions">
                            <button className="btn btn-primary" disabled={busy} onClick={() => changeVerification(row, "verified")}>Verify</button>
                            <button className="btn btn-ghost" disabled={busy} onClick={() => changeVerification(row, "rejected")}>Reject</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeTab === "events" && (
                <section aria-labelledby="admin-section-heading">
                  <h2 id="admin-section-heading">Events</h2>
                  {events.length === 0 ? (
                    <p className="field-hint">No events found.</p>
                  ) : (
                    <div className="admin-card-list">
                      {events.map((row) => (
                        <article className="admin-record" key={row.id}>
                          <div className="admin-record-heading">
                            <div>
                              <span className={`admin-status ${row.ended_at ? "is-rejected" : "is-pending"}`}>
                                {row.ended_at ? "ended" : "not ended"}
                              </span>
                              <h3>{row.title}</h3>
                            </div>
                            <span className="admin-record-date">{dateLabel(row.start_time)}</span>
                          </div>
                          {row.description && <p>{row.description}</p>}
                          <dl className="admin-detail-grid">
                            <div><dt>League</dt><dd>{row.league?.toUpperCase() || "General"}</dd></div>
                            <div><dt>Location</dt><dd>{row.location || "—"}</dd></div>
                            <div><dt>Scheduled end</dt><dd>{dateLabel(row.end_time)}</dd></div>
                          </dl>
                          {!row.ended_at && (
                            <div className="admin-actions">
                              <button className="btn btn-primary" disabled={busy} onClick={() => endEvent(row)}>End Event</button>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {(activeTab === "news" || activeTab === "awards" || activeTab === "highlights") && (
                <section aria-labelledby="admin-section-heading">
                  <div className="admin-section-heading">
                    <h2 id="admin-section-heading">
                      {activeTab === "news" ? "News Posts" : activeTab === "awards" ? "Award Winners" : "Match Highlights"}
                    </h2>
                    <button type="button" className="btn btn-primary" onClick={startCreate}>Add New</button>
                  </div>

                  <form className="admin-editor" onSubmit={submitContent}>
                    <h3>{editing ? "Edit item" : "Create item"}</h3>
                    {activeTab === "news" && (
                      <>
                        <label>Title<input value={draft.title} onChange={(e) => updateDraft("title", e.target.value)} required maxLength={200} /></label>
                        <label>Body<textarea value={draft.body} onChange={(e) => updateDraft("body", e.target.value)} required rows={6} /></label>
                        <div className="admin-form-grid">
                          <label>Category<select value={draft.category} onChange={(e) => updateDraft("category", e.target.value)}>
                            <option>League Update</option><option>Match Recap</option><option>Announcement</option><option>Community</option>
                          </select></label>
                          <label>Author name<input value={draft.author_name} onChange={(e) => updateDraft("author_name", e.target.value)} maxLength={120} /></label>
                        </div>
                        <label className="admin-checkbox"><input type="checkbox" checked={draft.published} onChange={(e) => updateDraft("published", e.target.checked)} /> Published</label>
                      </>
                    )}
                    {activeTab === "awards" && (
                      <div className="admin-form-grid">
                        <label>Award label<input value={draft.award_label} onChange={(e) => updateDraft("award_label", e.target.value)} required maxLength={100} /></label>
                        <label>Player name<input value={draft.player_name} onChange={(e) => updateDraft("player_name", e.target.value)} required maxLength={120} /></label>
                        <label>Season<input value={draft.season} onChange={(e) => updateDraft("season", e.target.value)} maxLength={100} /></label>
                        <label>Context<input value={draft.context} onChange={(e) => updateDraft("context", e.target.value)} maxLength={300} /></label>
                      </div>
                    )}
                    {activeTab === "highlights" && (
                      <>
                        <label>Title<input value={draft.title} onChange={(e) => updateDraft("title", e.target.value)} required maxLength={200} /></label>
                        <label>Description<textarea value={draft.description} onChange={(e) => updateDraft("description", e.target.value)} rows={3} /></label>
                        <div className="admin-form-grid">
                          <label>League<select value={draft.league} onChange={(e) => updateDraft("league", e.target.value)}>
                            <option value="">General</option><option value="rcml">RCML</option><option value="rfcl">RFCL</option><option value="rbsl">RBSL</option>
                          </select></label>
                          <label>Match label<input value={draft.match_label} onChange={(e) => updateDraft("match_label", e.target.value)} maxLength={200} /></label>
                          <label>Video URL<input type="url" value={draft.video_url} onChange={(e) => updateDraft("video_url", e.target.value)} /></label>
                          <label>Storage path<input value={draft.storage_path} onChange={(e) => updateDraft("storage_path", e.target.value)} /></label>
                        </div>
                      </>
                    )}
                    <div className="admin-actions">
                      <button type="submit" className="btn btn-primary" disabled={busy}>{editing ? "Save Changes" : "Create"}</button>
                      {editing && <button type="button" className="btn btn-ghost" onClick={startCreate}>Cancel Edit</button>}
                    </div>
                  </form>

                  {contentRows.length === 0 ? (
                    <p className="field-hint">No items yet.</p>
                  ) : (
                    <div className="admin-card-list">
                      {contentRows.map((row) => (
                        <article className="admin-record" key={row.id}>
                          <div className="admin-record-heading">
                            <div>
                              {"published" in row && <span className={`admin-status ${row.published ? "is-approved" : "is-pending"}`}>{row.published ? "published" : "draft"}</span>}
                              <h3>{"player_name" in row ? `${row.award_label}: ${row.player_name}` : row.title}</h3>
                            </div>
                            <span className="admin-record-date">{dateLabel(row.created_at)}</span>
                          </div>
                          {"body" in row && <p>{row.body}</p>}
                          {"context" in row && row.context && <p>{row.context}</p>}
                          {"description" in row && row.description && <p>{row.description}</p>}
                          {"video_url" in row && row.video_url && <p><a href={row.video_url} target="_blank" rel="noopener noreferrer">{row.video_url}</a></p>}
                          {"season" in row && row.season && <p><strong>Season:</strong> {row.season}</p>}
                          <div className="admin-actions">
                            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => startEdit(row)}>Edit</button>
                            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => deleteContent(row)}>Delete</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeTab === "admins" && (
                <section aria-labelledby="admin-section-heading">
                  <h2 id="admin-section-heading">Manage Administrators</h2>
                  <form className="admin-lookup" onSubmit={findProfile}>
                    <label htmlFor="admin-player-id">Promote player by Player ID</label>
                    <div className="admin-lookup-controls">
                      <input
                        id="admin-player-id"
                        value={lookupValue}
                        onChange={(event) => {
                          setLookupValue(event.target.value);
                          setProfileMatch(null);
                          setLookupError(null);
                        }}
                        placeholder="R3N-050758"
                        maxLength={10}
                        pattern="(R3N-?[0-9]{6}|R3E[0-9]{6})"
                        required
                      />
                      <button className="btn btn-ghost" disabled={lookingUp || busy} type="submit">
                        {lookingUp ? "Searching…" : "Find Player"}
                      </button>
                    </div>
                    {lookupError && <p className="admin-inline-error" role="alert">{lookupError}</p>}
                    {profileMatch && (
                      <div className="admin-match">
                        <span>{profileMatch.display_name || "Unnamed player"} · {profileMatch.player_id || profileMatch.league_id}</span>
                        <button className="btn btn-primary" disabled={busy} type="button" onClick={promoteAdmin}>Promote to Admin</button>
                      </div>
                    )}
                  </form>
                  {admins.length === 0 ? (
                    <p className="field-hint">No administrator records were returned.</p>
                  ) : (
                    <div className="admin-card-list">
                      {admins.map((row) => (
                        <article className="admin-record admin-admin-row" key={row.profile_id}>
                          <div>
                            <h3>{profileInfo(row.profile)?.display_name || "Unnamed player"}</h3>
                            <p className="admin-muted">{profileInfo(row.profile)?.player_id || profileInfo(row.profile)?.league_id || row.profile_id}</p>
                          </div>
                          <div className="admin-actions">
                            <span className="admin-record-date">Added {dateLabel(row.created_at)}</span>
                            <button className="btn btn-ghost" disabled={busy || admins.length <= 1} onClick={() => removeAdmin(row)}>Remove Admin</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
