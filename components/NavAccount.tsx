import { createClient } from "@/lib/supabase/server";
import NavAccountClient from "./NavAccountClient";

/** Server component — session read on the server, no client redirect flash. */
export default async function NavAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <NavAccountClient initial={null} avatarUrl={null} unreadCount={0} />;
  }

  const displayName =
    (user.user_metadata?.display_name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email ||
    "Account";
  const initial = displayName.charAt(0).toUpperCase();

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  const avatarUrl = profile?.avatar_url ?? null;

  let unreadCount = 0;
  try {
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null);
    unreadCount = count ?? 0;
  } catch {
    // best-effort
  }

  return (
    <NavAccountClient
      initial={initial}
      avatarUrl={avatarUrl}
      unreadCount={unreadCount}
    />
  );
}
