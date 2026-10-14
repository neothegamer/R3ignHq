"use client";

import { useActionState } from "react";
import {
  sendPartnershipInquiry,
  type InquiryState,
} from "./actions";

const INITIAL: InquiryState = { status: "idle", message: "" };

export default function PartnershipForm() {
  const [state, formAction, pending] = useActionState(
    sendPartnershipInquiry,
    INITIAL
  );

  if (state.status === "success") {
    return (
      <p className="form-success is-visible" role="status">
        {state.message}
      </p>
    );
  }

  const errors = state.errors ?? {};
  const values = state.values;

  return (
    <form action={formAction} noValidate>
      {state.status === "error" && !state.errors ? (
        <p className="field-error" role="alert" style={{ display: "block" }}>
          {state.message}
        </p>
      ) : null}

      <div className="field-row">
        <div className={`field${errors.name ? " has-error" : ""}`}>
          <label htmlFor="pf-name">
            Your name <span className="req">*</span>
          </label>
          <input
            id="pf-name"
            name="name"
            type="text"
            autoComplete="name"
            defaultValue={values?.name}
            maxLength={100}
          />
          <p className="field-error">{errors.name}</p>
        </div>
        <div className={`field${errors.email ? " has-error" : ""}`}>
          <label htmlFor="pf-email">
            Email <span className="req">*</span>
          </label>
          <input
            id="pf-email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={values?.email}
            maxLength={254}
          />
          <p className="field-error">{errors.email}</p>
        </div>
      </div>

      <div className="field">
        <label htmlFor="pf-company">Company or brand</label>
        <input
          id="pf-company"
          name="company"
          type="text"
          autoComplete="organization"
          defaultValue={values?.company}
          maxLength={100}
        />
      </div>

      <div className={`field${errors.message ? " has-error" : ""}`}>
        <label htmlFor="pf-message">
          How would you like to work with us? <span className="req">*</span>
        </label>
        <textarea
          id="pf-message"
          name="message"
          rows={5}
          defaultValue={values?.message}
          maxLength={3000}
        />
        <p className="field-error">{errors.message}</p>
      </div>

      {/* Honeypot: hidden from people, tempting to bots. */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", height: 0 }}
      >
        <label htmlFor="pf-website">Website</label>
        <input
          id="pf-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
