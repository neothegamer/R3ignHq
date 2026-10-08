"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Props = {
  initial: string | null;
  avatarUrl: string | null;
  profileHref?: string;
  unreadCount: number;
};

export default function NavAccountClient({
  initial,
  avatarUrl,
  profileHref = "/account",
  unreadCount,
}: Props) {
  const pathname = usePathname();
  const onMessages = pathname.startsWith("/messages");
  const onProfile = pathname.startsWith("/player/");
  const onAccount =
    pathname.startsWith("/account") ||
    pathname.startsWith("/profile-settings");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const authenticated = initial !== null;

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <span id="nav-account" className="nav-account">
      <div className="nav-account-menu-wrap" ref={menuRef}>
        <Link
          href={authenticated ? profileHref : "/account"}
          className="nav-profile-link"
          aria-label={
            authenticated ? "View my public profile" : "Sign in or open my account"
          }
          aria-current={onProfile ? "page" : onAccount ? "page" : undefined}
          onClick={() => setMenuOpen(false)}
        >
          <span className="nav-profile-avatar" aria-hidden="true">
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
        {authenticated && (
          <>
            <button
              ref={menuButtonRef}
              type="button"
              className="nav-account-menu-toggle"
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls="nav-account-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                focusable="false"
              >
                <path d="m4 6 4 4 4-4" />
              </svg>
            </button>
            {menuOpen && (
              <div
                className="nav-account-menu"
                id="nav-account-menu"
                role="menu"
              >
                <Link
                  href={profileHref}
                  role="menuitem"
                  aria-current={onProfile ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  My profile
                </Link>
                <Link
                  href="/account"
                  role="menuitem"
                  aria-current={onAccount ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  Account settings
                </Link>
                <Link
                  href="/auth/signout"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign out
                </Link>
              </div>
            )}
          </>
        )}
      </div>
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
