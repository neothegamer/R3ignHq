"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  initial: string | null;
  avatarUrl: string | null;
  unreadCount: number;
};

export default function NavAccountClient({
  initial,
  avatarUrl,
  unreadCount,
}: Props) {
  const pathname = usePathname();
  const onMessages = pathname.startsWith("/messages");
  const onAccount =
    pathname.startsWith("/account") ||
    pathname.startsWith("/profile-settings");

  return (
    <span id="nav-account" className="nav-account">
      <Link
        href="/account"
        className="nav-profile-link"
        aria-label={initial ? "Open my account" : "Sign in or open my account"}
        aria-current={onAccount ? "page" : undefined}
      >
        <span
          className="nav-profile-avatar"
          aria-hidden="true"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" />
          ) : initial ? (
            initial
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              focusable="false"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          )}
        </span>
      </Link>
      <Link
        href="/messages"
        className="nav-icon-link nav-message-link"
        aria-label={
          unreadCount > 0
            ? `Open messages, ${unreadCount} unread`
            : "Open messages"
        }
        aria-current={onMessages ? "page" : undefined}
      >
        <span className="nav-message-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            focusable="false"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M8 8h8" />
            <path d="M8 12h5" />
          </svg>
        </span>
        {unreadCount > 0 && (
          <span className="nav-badge-dot" aria-hidden="true" />
        )}
      </Link>
    </span>
  );
}
