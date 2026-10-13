import { getServerAuth } from "@/lib/supabase/auth";
import NavAccountClient from "@/components/NavAccountClient";

type Props = { mobileMenu?: boolean };

export default async function NavAccount({ mobileMenu = false }: Props) {
  const { supabase, user } = await getServerAuth();

  if (!user) {
    return <NavAccountClient initial={null} avatarUrl={null} mobileMenu={mobileMenu} />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, player_id, league_id")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile?.display_name || user.email || "?";
  const publicId = profile?.player_id || profile?.league_id;

  return (
    <NavAccountClient
      initial={name.charAt(0).toUpperCase()}
      avatarUrl={profile?.avatar_url ?? null}
      profileHref={publicId ? `/player/${encodeURIComponent(publicId)}` : "/account"}
      mobileMenu={mobileMenu}
    />
  );
}