import { getServerAuth } from "@/lib/supabase/auth";
import NavAccountClient from "./NavAccountClient";

type Props = {
  mobileMenu?: boolean;
};

/** Server component — session read on the server, no client redirect flash. */
export default async function NavAccount({ mobileMenu = false }: Props) {
  const { supabase, user } = await getServerAuth();

  if (!user) {
    return (
      <NavAccountClient
        initial={null}
        avatarUrl={null}
        mobileMenu={mobileMenu}
      />
    );
  }

  const displayName =
    (user.user_metadata?.display_name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email ||
    "R3IGN";
  const initial = displayName.match(/[a-z]/i)?.[0].toUpperCase() ?? "R";

  let profileResult = await supabase
    .from("profiles")
    .select("avatar_url,player_id,league_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileResult.error) throw profileResult.error;

  let avatarUrl = profileResult.data?.avatar_url ?? null;
  let profileId =
    profileResult.data?.player_id || profileResult.data?.league_id || null;

  // Best-effort: repair missing public ID so "My profile" always links correctly
  if (!profileId) {
    try {
      await supabase.rpc("ensure_my_player_id");
    } catch {
      /* optional RPC */
    }
    try {
      await supabase.rpc("ensure_my_league_id");
    } catch {
      /* optional RPC */
    }

    profileResult = await supabase
      .from("profiles")
      .select("avatar_url,player_id,league_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profileResult.error && profileResult.data) {
      avatarUrl = profileResult.data.avatar_url ?? null;
      profileId =
        profileResult.data.player_id || profileResult.data.league_id || null;
    }
  }

  return (
    <NavAccountClient
      initial={initial}
      avatarUrl={avatarUrl}
      profileHref={
        profileId ? `/player/${encodeURIComponent(profileId)}` : "/account"
      }
      mobileMenu={mobileMenu}
    />
  );
}
