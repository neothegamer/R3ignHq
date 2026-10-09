import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

/**
 * Session refresh per @supabase/ssr pattern.
 * Must call getUser() (not getSession) so the refresh token is rotated
 * and cookies are written back — otherwise users get silently logged out.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not remove — refreshes the session on every matched request.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const protectedPaths = ["/messages", "/player-market"];
  const isProtected = protectedPaths.some(
    (p) => path === p || path.startsWith(p + "/")
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // Onboarding gate: newly created accounts must finish setup first.
  // /account stays reachable so the "Complete your setup" banner can resume.
  const ONBOARDING_BYPASS = [
    "/onboarding",
    "/auth",
    "/signin",
    "/signup",
    "/account",
  ];
  const bypassesOnboardingGate = ONBOARDING_BYPASS.some(
    (p) => path === p || path.startsWith(p + "/")
  );

  if (user && !bypassesOnboardingGate) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.onboarding_completed === false) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}