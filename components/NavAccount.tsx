import { getServerAuth } from "@/lib/supabase/auth";
import NavAccountClient from "./NavAccountClient";

/** Server component — session read on the server, no client redirect flash. */
export default async function NavAccount() {
  const { supabase, user } = await getServerAuth();

  if (!user) {
    return <NavAccountClient initial={null} avatarUrl={null} unreadCount={0} />;
  }

  const displayName =
    (user.user_metadata?.display_name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email ||
    "Account";
  const initial = displayName.charAt(0).toUpperCase();

  const [profileResult, unreadResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (unreadResult.error) throw unreadResult.error;

  const avatarUrl = profileResult.data?.avatar_url ?? null;
  const unreadCount = unreadResult.count ?? 0;

  return (
    <NavAccountClient
      initial={initial}
      avatarUrl={avatarUrl}
      unreadCount={unreadCount}
    />
  );
}
