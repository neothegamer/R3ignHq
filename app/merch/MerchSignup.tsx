"use client";

import { useActionState } from "react";
import { joinMerchWaitlist, type WaitlistState } from "./actions";

const INITIAL: WaitlistState = { status: "idle", message: "" };

export default function MerchSignup() {
  const [state, formAction, pending] = useActionState(
    joinMerchWaitlist,
    INITIAL
  );

  if (state.status === "success") {
    return (
      <p className="form-success is-visible" role="status">
        {state.message}
      </p>
    );
  }

  return (
    <form
      action={formAction}
      noValidate
      style={{ maxWidth: "28rem", margin: "0 auto", textAlign: "left" }}
    >
      <div className={`field${state.status === "error" ? " has-error" : ""}`}>
        <label htmlFor="merch-email">Email address</label>
        <input
          id="merch-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        {state.status === "error" ? (
          <p className="field-error" role="alert">
            {state.message}
          </p>
        ) : (
          <p className="field-hint">
            We&rsquo;ll only email you about the merch launch.
          </p>
        )}
      </div>

      {/* Honeypot: hidden from people, tempting to bots. */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", height: 0 }}
      >
        <label htmlFor="merch-website">Website</label>
        <input
          id="merch-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Joining…" : "Notify me"}
      </button>
    </form>
  );
}
