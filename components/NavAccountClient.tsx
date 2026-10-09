"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

type Props = {
  initial: string | null;
  avatarUrl: string | null;
  profileHref?: string;
  mobileMenu?: boolean;
};
export default function NavAccountClient({
  initial,
  avatarUrl,
  profileHref = "/account",
  mobileMenu = false,
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
  const mobileProfileRef = useRef<HTMLLIElement>(null);
  const mobileProfileButtonRef = useRef<HTMLButtonElement>(null);
  const authenticated = initial !== null;
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [mobileViewport, setMobileViewport] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1100px)");
    const update = () => setMobileViewport(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setMobileProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenu || !mobileProfileOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !mobileProfileRef.current?.contains(event.target)
      ) {
        setMobileProfileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileProfileOpen(false);
        mobileProfileButtonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenu, mobileProfileOpen]);

  const avatar = (
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
  );

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

  if (mobileMenu) {
    return (
      <li
        ref={mobileProfileRef}
        className={`nav-group mobile-account-nav-item${
          mobileProfileOpen ? " is-open" : ""
        }`}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setMobileProfileOpen(false);
          }
        }}
        onKeyDown={(event: ReactKeyboardEvent<HTMLLIElement>) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setMobileProfileOpen(false);
            mobileProfileButtonRef.current?.focus();
            return;
          }
          if (
            !mobileProfileOpen ||
            !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
          ) {
            return;
          }
          const items = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              '#mobile-profile-menu [role="menuitem"]'
            )
          );
          if (!items.length) return;
          event.preventDefault();
          if (event.key === "Home") items[0].focus();
          else if (event.key === "End") items[items.length - 1].focus();
          else {
            const current = items.indexOf(event.target as HTMLElement);
            const offset = event.key === "ArrowDown" ? 1 : -1;
            const next =
              current < 0
                ? event.key === "ArrowDown"
                  ? 0
                  : items.length - 1
                : (current + offset + items.length) % items.length;
            items[next].focus();
          }
        }}
      >
        <div className="nav-group-heading">
          <Link
            href={authenticated ? profileHref : "/account"}
            aria-current={onProfile || onAccount ? "page" : undefined}
            className={onProfile || onAccount ? "is-section-active" : undefined}
            onClick={() => setMobileProfileOpen(false)}
          >
            Profile
          </Link>
          {authenticated && (
            <button
              ref={mobileProfileButtonRef}
              type="button"
              className="dropdown-toggle"
              aria-label="Profile menu"
              aria-haspopup="menu"
              aria-expanded={mobileProfileOpen}
              aria-controls="mobile-profile-menu"
              onClick={() => setMobileProfileOpen((open) => !open)}
            >
              <span aria-hidden="true" />
            </button>
          )}
        </div>
        {authenticated && (
          <>
            <ul
              className={`dropdown-menu${mobileProfileOpen ? " is-open" : ""}`}
              id="mobile-profile-menu"
              role="menu"
              aria-label="Profile links"
              hidden={!mobileProfileOpen}
            >
              <li role="none">
                <Link
                  href="/messages"
                  role="menuitem"
                  aria-current={onMessages ? "page" : undefined}
                >
                  Messages
                </Link>
              </li>
              <li role="none">
                <Link
                  href="/account"
                  role="menuitem"
                  aria-current={onAccount ? "page" : undefined}
                >
                  Account settings
                </Link>
              </li>
            </ul>
            <Link
              href="/auth/signout"
              className="btn btn-primary mobile-profile-signout"
            >
              Sign out
            </Link>
          </>
        )}
      </li>
    );
  }

  return (
    <span id="nav-account" className="nav-account">
      <div className="nav-account-menu-wrap" ref={menuRef}>
        {mobileViewport ? (
          <span
            className="nav-profile-link nav-profile-link-static"
            aria-hidden="true"
          >
            {avatar}
          </span>
        ) : (
          <Link
            href={authenticated ? profileHref : "/account"}
            className="nav-profile-link"
            aria-label={
              authenticated ? "View my public profile" : "Sign in or open my account"
            }
            aria-current={onProfile ? "page" : onAccount ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            {avatar}
          </Link>
        )}
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
                  href="/messages"
                  role="menuitem"
                  aria-current={onMessages ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  Messages
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
    </span>
  );
}
