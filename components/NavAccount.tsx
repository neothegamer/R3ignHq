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

  const profileResult = await supabase
    .from("profiles")
    .select("avatar_url,player_id,league_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileResult.error) throw profileResult.error;

  const avatarUrl = profileResult.data?.avatar_url ?? null;
  const profileId =
    profileResult.data?.player_id || profileResult.data?.league_id || null;

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
