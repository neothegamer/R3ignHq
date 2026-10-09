"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";

type Props = {
  /** Server-rendered account area — avoids client flash */
  accountSlot: ReactNode;
  /** Account links shown inside the mobile navigation only */
  mobileAccountSlot: ReactNode;
  /** Sign-out action shown after the mobile navigation groups */
  mobileSignOutSlot: ReactNode;
};

const NAV_GROUPS = [
  {
    label: "Home",
    href: "/",
    children: [{ label: "About", href: "/about" }],
  },
  {
    label: "Leagues",
    href: "/leagues",
    children: [
      { label: "Rankings", href: "/rankings" },
      { label: "Divisions", href: "/divisions" },
      { label: "Brackets", href: "/brackets" },
      { label: "Awards", href: "/awards" },
    ],
  },
  {
    label: "Events",
    href: "/events",
    children: [
      { label: "Highlights", href: "/match-highlights" },
      { label: "News", href: "/news" },
      { label: "Community", href: "/community" },
    ],
  },
  {
    label: "Organizations",
    href: "/organizations",
    children: [{ label: "Player Market", href: "/player-market" }],
  },
] as const;

export default function Header({
  accountSlot,
  mobileAccountSlot,
  mobileSignOutSlot,
}: Props) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  useEffect(() => {
    setMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const sync = () => {
      document.documentElement.style.setProperty(
        "--header-h",
        `${header.getBoundingClientRect().height}px`
      );
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdown(null);
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(
    () => () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    },
    []
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const clearHoverTimer = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const openOnHover = (index: number) => {
    if (window.matchMedia("(max-width: 1100px)").matches) return;
    clearHoverTimer();
    hoverTimer.current = setTimeout(() => setOpenDropdown(index), 100);
  };

  const closeOnHoverLeave = () => {
    if (window.matchMedia("(max-width: 1100px)").matches) return;
    clearHoverTimer();
    hoverTimer.current = setTimeout(() => setOpenDropdown(null), 140);
  };

  const handleMenuKeyDown = (
    event: ReactKeyboardEvent<HTMLUListElement>,
    index: number
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpenDropdown(null);
      navRef.current
        ?.querySelector<HTMLButtonElement>(`[aria-controls="nav-menu-${index}"]`)
        ?.focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const menu = event.currentTarget.querySelector<HTMLElement>(
      `[data-menu-index="${index}"]`
    );
    const items = menu
      ? Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'))
      : [];
    if (items.length === 0) return;
    event.preventDefault();
    setOpenDropdown(index);
    if (event.key === "Home") items[0].focus();
    else if (event.key === "End") items[items.length - 1].focus();
    else {
      const current = items.indexOf(event.target as HTMLElement);
      if (current < 0) {
        (event.key === "ArrowDown" ? items[0] : items[items.length - 1]).focus();
      } else {
        const offset = event.key === "ArrowDown" ? 1 : -1;
        items[(current + offset + items.length) % items.length].focus();
      }
    }
  };

  return (
    <header className="site-header">
      <div className="wrap nav">
        <Link href="/" className="brand" aria-label="R3IGN HQ">
          <img
            src="/assets/r3ign-logo-256.jpg"
            alt=""
            className="brand-mark"
            fetchPriority="high"
            loading="eager"
            decoding="async"
          />
          <span className="brand-text">
            <span className="brand-name">R3IGN HQ</span>
            <span className="brand-tagline">League and competitive esports</span>
          </span>
        </Link>

        <nav aria-label="Primary" ref={navRef}>
          <ul
            className={`nav-links ${menuOpen ? "is-open" : ""}`}
            id="nav-links"
            onKeyDown={(event) =>
              openDropdown !== null &&
              handleMenuKeyDown(event, openDropdown)
            }
          >
            {mobileAccountSlot}
            {NAV_GROUPS.map((group, index) => {
              const active =
                isActive(group.href) ||
                group.children.some((child) => isActive(child.href));
              const dropdownOpen = openDropdown === index;
              const menuId = `nav-menu-${index}`;
              return (
                <li
                  className={`nav-group${dropdownOpen ? " is-open" : ""}`}
                  key={group.label}
                  onMouseEnter={() => openOnHover(index)}
                  onMouseLeave={closeOnHoverLeave}
                  onBlur={(event) => {
                    if (
                      !event.currentTarget.contains(event.relatedTarget as Node)
                    ) {
                      setOpenDropdown(null);
                    }
                  }}
                >
                  <div className="nav-group-heading">
                    <Link
                      href={group.href}
                      aria-current={isActive(group.href) ? "page" : undefined}
                      className={active ? "is-section-active" : undefined}
                      onClick={() => {
                        setOpenDropdown(null);
                        setMenuOpen(false);
                      }}
                    >
                      {group.label}
                    </Link>
                    <button
                      type="button"
                      className="dropdown-toggle"
                      aria-label={`${group.label} menu`}
                      aria-haspopup="menu"
                      aria-expanded={dropdownOpen}
                      aria-controls={menuId}
                      onClick={() => {
                        clearHoverTimer();
                        setOpenDropdown(dropdownOpen ? null : index);
                      }}
                    >
                      <span aria-hidden="true" />
                    </button>
                  </div>
                  <ul
                    className={`dropdown-menu${dropdownOpen ? " is-open" : ""}`}
                    id={menuId}
                    role="menu"
                    aria-label={`${group.label} links`}
                    data-menu-index={index}
                    hidden={!dropdownOpen}
                  >
                    {group.children.map((child) => (
                      <li key={child.href} role="none">
                        <Link
                          href={child.href}
                          role="menuitem"
                          tabIndex={dropdownOpen ? 0 : -1}
                          aria-current={
                            isActive(child.href) ? "page" : undefined
                          }
                          onClick={() => {
                            setOpenDropdown(null);
                            setMenuOpen(false);
                          }}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
            {mobileSignOutSlot}
          </ul>
        </nav>

        <div className="nav-cta">
          {accountSlot}
          <button
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="nav-links"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => {
              setMenuOpen((open) => !open);
              setOpenDropdown(null);
            }}
          >
            <span />
          </button>
        </div>
      </div>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          <span>RCML SEASON 4 — DIVISION 1 IN PROGRESS</span>
          <span>RFCL — REGISTRATION OPENING SOON</span>
          <span>RBSL — REGISTRATION OPENING SOON</span>
          <span>1,500+ PLAYERS ACROSS 50+ ORGANIZATIONS</span>
          <span>RCML SEASON 4 — DIVISION 1 IN PROGRESS</span>
          <span>RFCL — REGISTRATION OPENING SOON</span>
          <span>RBSL — REGISTRATION OPENING SOON</span>
          <span>1,500+ PLAYERS ACROSS 50+ ORGANIZATIONS</span>
        </div>
      </div>
    </header>
  );
}
