import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Signs the user out (POST only) and clears cached signed-in pages. */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}

/** Visiting the URL directly (or link prefetching) no longer signs out. */
export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/", request.url));
}
