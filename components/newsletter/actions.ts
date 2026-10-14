"use server";

import { createClient } from "@/lib/supabase/server";

export type NewsletterState = {
  status: "idle" | "success" | "error";
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const SUCCESS: NewsletterState = {
  status: "success",
  message: "You're on the list. Watch your inbox for league news.",
};

/**
 * Adds an email to `newsletter_subscribers`. The table allows public inserts
 * and only admins can read it. A duplicate email counts as success so the
 * form never reveals who is already subscribed.
 */
export async function subscribeToNewsletter(
  _previous: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  // Hidden honeypot field: real visitors never fill it in.
  if (String(formData.get("website") ?? "").trim() !== "") return SUCCESS;

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email });

  // 23505 = already subscribed.
  if (error && error.code !== "23505") {
    return {
      status: "error",
      message: "We couldn't save your email right now. Please try again later.",
    };
  }

  return SUCCESS;
}
