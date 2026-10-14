import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdminClient from "./AdminClient";

export const metadata: Metadata = {
  title: "Admin · R3IGN HQ",
  description: "Manage R3IGN HQ registrations, events, and content.",
  // The admin area is private: keep it out of search results.
  robots: { index: false, follow: false },
};

/** Shown to anyone who is not signed in. */
function SignInRequired() {
  return (
    <main id="main-content">
      <section className="section-tight">
        <div className="wrap">
          <div className="admin-access-card">
            <span className="eyebrow">Restricted Area</span>
            <h1>Sign in to continue</h1>
            <p>
              This area is for R3IGN HQ administrators. Sign in with your
              account to continue.
            </p>
            <Link className="btn btn-primary" href="/signin">
              Sign In
            </Link>{" "}
            <Link className="btn btn-ghost" href="/">
              Return to R3IGN HQ
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Visitors with no session get an error from Supabase ("Auth session
  // missing!"). That just means "not signed in", so show the sign-in screen.
  const noSession =
    !user ||
    authError?.name === "AuthSessionMissingError" ||
    /session missing/i.test(authError?.message ?? "");
  if (noSession || !user) return <SignInRequired />;

  if (authError) {
    return (
      <main id="main-content">
        <section className="section-tight">
          <div className="wrap">
            <div className="admin-access-card" role="alert">
              <h1>Admin access unavailable</h1>
              <p>
                We could not verify your sign-in session. Please sign in
                again.
              </p>
              <Link className="btn btn-primary" href="/signin">
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const { data: admin, error } = await supabase
    .from("admins")
    .select("profile_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <main id="main-content">
        <section className="section-tight">
          <div className="wrap">
            <div className="admin-access-card" role="alert">
              <h1>Admin access unavailable</h1>
              <p>
                We could not verify your administrator access. Please try
                again, or contact a site administrator.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!admin) {
    return (
      <main id="main-content">
        <section className="section-tight">
          <div className="wrap">
            <div className="admin-access-card">
              <span className="eyebrow">Restricted Area</span>
              <h1>Access Denied</h1>
              <p>Your account does not have permission to view this page.</p>
              <Link className="btn btn-ghost" href="/">
                Return to R3IGN HQ
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return <AdminClient />;
}
