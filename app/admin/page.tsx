import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminClient from "./AdminClient";

export const metadata = {
  title: "Admin · R3IGN HQ",
  description: "Manage R3IGN HQ registrations, events, and content.",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return (
      <main id="main-content">
        <section className="section-tight">
          <div className="wrap">
            <div className="admin-access-card" role="alert">
              <h1>Admin access unavailable</h1>
              <p>We could not verify your sign-in session.</p>
              <p className="admin-inline-error">{authError.message}</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!user) redirect("/signin");

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
              <p className="admin-inline-error">{error.message}</p>
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
