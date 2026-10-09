import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getServerAuth = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  // Don’t crash the whole page on network / config errors
  if (error && error.name !== "AuthSessionMissingError") {
    console.error("[getServerAuth]", error.name, error.message);
    return { supabase, user: null };
  }

  return { supabase, user: data.user };
});