import { getServerAuth } from "@/lib/supabase/auth";

/** Render the mobile sign-out action separately from the profile controls. */
export default async function MobileSignOut() {
  const { user } = await getServerAuth();
  if (!user) return null;

  return (
    <li className="mobile-signout-nav-item">
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="btn btn-primary mobile-profile-signout"
        >
          Sign out
        </button>
      </form>
    </li>
  );
}
