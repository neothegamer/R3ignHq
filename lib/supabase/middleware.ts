import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

/**
 * Session refresh per @supabase/ssr pattern.
 * Must call getUser() (not getSession) so the refresh token is rotated
 * and cookies are written back — otherwise users get silently logged out.
 *
 * Fail-open: network / config errors are logged and treated as "logged out"
 * so the rest of the site still loads.
 */
export async function updateSession(request: NextRequest) {
  // Temporary debug – remove once the env issue is fixed
  console.log("=== SUPABASE ENV CHECK ===");
  console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log(
    "KEY starts with:",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 25)
  );
  console.log("==========================");

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
  let user = null;
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch (err: any) {
    // AuthRetryableFetchError (status 0), network issues, missing env, etc.
    console.error(
      "[middleware] auth.getUser failed:",
      err?.name,
      err?.message
    );
    // Continue as logged-out so the page still renders
  }

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
    try {
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
    } catch (err: any) {
      console.error(
        "[middleware] profiles query failed:",
        err?.message ?? err
      );
      // Fail open – don’t block the request
    }
  }

  return supabaseResponse;
}