"use client";

import { useActionState } from "react";
import {
  subscribeToNewsletter,
  type NewsletterState,
} from "./actions";

const INITIAL: NewsletterState = { status: "idle", message: "" };

export default function NewsletterForm() {
  const [state, formAction, pending] = useActionState(
    subscribeToNewsletter,
    INITIAL
  );

  if (state.status === "success") {
    return (
      <div
        className="form-success is-visible"
        role="status"
        style={{ marginTop: "1.25rem" }}
      >
        {state.message}
      </div>
    );
  }

  return (
    <>
      {state.status === "error" ? (
        <div
          className="auth-error is-visible"
          role="alert"
          style={{ marginTop: "1rem" }}
        >
          {state.message}
        </div>
      ) : null}

      <form
        action={formAction}
        noValidate
        style={{
          marginTop: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.65rem",
          justifyContent: "center",
          alignItems: "stretch",
          maxWidth: 420,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {/* Honeypot: hidden from people, tempting to bots. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "-9999px",
            opacity: 0,
            height: 0,
            overflow: "hidden",
          }}
        >
          <label htmlFor="newsletter-website">Website</label>
          <input
            type="text"
            id="newsletter-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <label htmlFor="newsletter-email" className="visually-hidden">
          Email
        </label>
        <input
          type="email"
          id="newsletter-email"
          name="email"
          required
          placeholder="you@email.com"
          autoComplete="email"
          style={{
            flex: "1 1 200px",
            minWidth: 0,
            margin: 0,
            boxSizing: "border-box",
            background: "var(--panel)",
            border: "1px solid var(--line)",
            color: "var(--paper)",
            padding: "0.9em 1em",
            fontFamily: "var(--f-body)",
            fontSize: "0.95rem",
            lineHeight: 1.25,
            height: "auto",
          }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={pending}
          style={{
            alignSelf: "stretch",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            padding: "0.9em 1.5em",
          }}
        >
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </form>
    </>
  );
}
