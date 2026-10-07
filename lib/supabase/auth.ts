import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getServerAuth = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError") {
    throw error;
  }

  return { supabase, user: data.user };
});
