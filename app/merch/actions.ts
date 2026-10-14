"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type WaitlistState = {
  status: "idle" | "success" | "error";
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const SUCCESS: WaitlistState = {
  status: "success",
  message: "You're on the list. We'll email you when the first drop is live.",
};

/**
 * Adds an email to the merch waitlist.
 *
 * The `merch_waitlist` table only allows inserts from the public site; nobody
 * can read the list back through the website. A duplicate email is treated as
 * a success so the form never reveals who is already signed up.
 */
export async function joinMerchWaitlist(
  _previous: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  // Hidden honeypot field: real visitors never fill it in.
  if (String(formData.get("website") ?? "").trim() !== "") return SUCCESS;

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return {
      status: "error",
      message: "Please enter a valid email address.",
    };
  }

  const supabase = await createClient();
  // `merch_waitlist` is not in the generated database types yet, so the client
  // is widened for this one insert.
  const { error } = await (supabase as unknown as SupabaseClient)
    .from("merch_waitlist")
    .insert({ email });

  // 23505 = already on the list.
  if (error && error.code !== "23505") {
    return {
      status: "error",
      message: "We couldn't save your email right now. Please try again later.",
    };
  }

  return SUCCESS;
}
