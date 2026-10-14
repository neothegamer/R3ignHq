"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";

export type InquiryValues = {
  name: string;
  email: string;
  company: string;
  message: string;
};

export type InquiryState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<"name" | "email" | "message", string>>;
  /** Echoed back on an error so the visitor does not lose what they typed. */
  values?: InquiryValues;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const SUCCESS: InquiryState = {
  status: "success",
  message: "Thanks. We've received your message and will reply by email.",
};

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, max);
}

/** Sends the enquiry with Resend. Only used when RESEND_API_KEY is set. */
async function sendWithResend(values: InquiryValues): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  // Until you verify your own domain in Resend, "onboarding@resend.dev" can
  // only deliver to the email address of your Resend account.
  const from =
    process.env.PARTNERSHIPS_FROM_EMAIL || "R3IGN HQ <onboarding@resend.dev>";

  const subjectName = values.name.replace(/[\r\n]+/g, " ").slice(0, 60);
  const text = [
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    `Company: ${values.company || "—"}`,
    "",
    values.message,
  ].join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [SITE.contactEmail],
        reply_to: values.email,
        subject: `Partnership enquiry from ${subjectName}`,
        text,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Handles the Partnerships contact form.
 *
 * Every enquiry is saved to the `partnership_inquiries` table (insert-only
 * for the public site). If RESEND_API_KEY is set it is also emailed to
 * SITE.contactEmail. The visitor sees success if either one worked.
 */
export async function sendPartnershipInquiry(
  _previous: InquiryState,
  formData: FormData
): Promise<InquiryState> {
  // Hidden honeypot field: real visitors never fill it in.
  if (clean(formData.get("website"), 200) !== "") return SUCCESS;

  const values: InquiryValues = {
    name: clean(formData.get("name"), 100),
    email: clean(formData.get("email"), 254).toLowerCase(),
    company: clean(formData.get("company"), 100),
    message: clean(formData.get("message"), 3000),
  };

  const errors: NonNullable<InquiryState["errors"]> = {};
  if (!values.name) errors.name = "Please enter your name.";
  if (!EMAIL_RE.test(values.email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (values.message.length < 10) {
    errors.message = "Please write at least a couple of sentences.";
  }
  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors,
      values,
    };
  }

  // `partnership_inquiries` is not in the generated database types yet, so the
  // client is widened for this one insert.
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { error } = await supabase.from("partnership_inquiries").insert({
    name: values.name,
    email: values.email,
    company: values.company || null,
    message: values.message,
  });
  const saved = !error;

  const emailed = await sendWithResend(values);

  if (!saved && !emailed) {
    return {
      status: "error",
      message: `We couldn't send your message right now. Please email ${SITE.contactEmail} instead.`,
      values,
    };
  }

  return SUCCESS;
}
