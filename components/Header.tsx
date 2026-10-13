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

const STATUS_ITEMS = [
  { league: "RCML", text: "Season 4 / Division 1 in progress", live: true },
  { league: "RFCL", text: "Registration opening soon", live: false },
  { league: "RBSL", text: "Registration opening soon", live: false },
  { league: "RCML", text: "Season 4 / 5 teams competing", live: false },
];

/* Inline icons — no icon package needed. */
function Icon({ path, size = 14 }: { path: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  chevron: "m6 9 6 6 6-6",
  arrow: "M7 17 17 7 M9 7h8v8",
  home: "M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z",
  trophy:
    "M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M10 14h4l.7 5H9.3zM8 20h8",
  calendar:
    "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M9 14h2M14 14h2M9 17h2M14 17h2",
  users:
    "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M18 20a7 7 0 0 0-2.5-5.3",
};

export default function Header({
  accountSlot,
  mobileAccountSlot,
  mobileSignOutSlot,
}: Props) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toggleRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  /* Close everything whenever the route changes. */
  useEffect(() => {
    setMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  /* Publish the measured header height — other layouts read --header-h. */
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const sync = () =>
      document.documentElement.style.setProperty(
        "--header-h",
        `${header.getBoundingClientRect().height}px`,
      );
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  /* Click-away and Escape. */
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !headerRef.current?.contains(event.target)
      ) {
        setOpenDropdown(null);
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (openDropdown !== null) {
        toggleRefs.current[openDropdown]?.focus();
      } else if (menuOpen) {
        headerRef.current
          ?.querySelector<HTMLButtonElement>(".hq-nav-toggle")
          ?.focus();
      }
      setOpenDropdown(null);
      setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openDropdown, menuOpen]);

  useEffect(
    () => () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    },
    [],
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

  /* Hover only opens menus on tablet/desktop; touch layouts use the toggle. */
  const isHoverCapable = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 768px)").matches;

  const openOnHover = (index: number) => {
    if (!isHoverCapable()) return;
    clearHoverTimer();
    hoverTimer.current = setTimeout(() => setOpenDropdown(index), 90);
  };

  const closeOnHoverLeave = () => {
    if (!isHoverCapable()) return;
    clearHoverTimer();
    hoverTimer.current = setTimeout(() => setOpenDropdown(null), 140);
  };

  const handleMenuKeyDown = (
    event: ReactKeyboardEvent<HTMLLIElement>,
    index: number,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpenDropdown(null);
      toggleRefs.current[index]?.focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        `#hq-menu-${index} [role="menuitem"]`,
      ),
    );
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

  const statusTrack = (key: string) => (
    <span className="hq-status-track" key={key} aria-hidden="true">
      {STATUS_ITEMS.map((item) => (
        <span className="hq-status-item" key={`${key}-${item.league}-${item.text}`}>
          <span className="hq-status-league">{item.league}</span>
          <span>{item.text}</span>
          {item.live && <span className="hq-live-badge">LIVE</span>}
        </span>
      ))}
    </span>
  );

  return (
    <header className="hq-header" ref={headerRef}>
      <div className="hq-nav-wrap">
        <Link href="/" className="hq-brand" aria-label="R3IGN HQ">
          <img
            src="/assets/r3ign-logo-256.jpg"
            alt="R3IGN HQ"
            className="hq-brand-mark"
            fetchPriority="high"
            loading="eager"
            decoding="async"
          />
          <span className="hq-brand-copy">
            <span className="hq-brand-name">
              R3IGN
              <span>HQ</span>
              <span className="hq-brand-dot">.</span>
            </span>
            <span className="hq-brand-tagline">
              League and competitive esports
            </span>
          </span>
        </Link>

        <nav
          aria-label="Primary"
          id="hq-navigation"
          className={`hq-navigation${menuOpen ? " is-open" : ""}`}
        >
          <ul className="hq-nav-list">
            {mobileAccountSlot}
            {NAV_GROUPS.map((group, index) => {
              const active =
                isActive(group.href) ||
                group.children.some((child) => isActive(child.href));
              const dropdownOpen = openDropdown === index;
              const GroupIcon = [ICONS.home, ICONS.trophy, ICONS.calendar, ICONS.users][
                index % 4
              ];
              return (
                <li
                  className={`hq-nav-group${
                    active ? " is-section-active" : ""
                  }${dropdownOpen ? " is-open" : ""}`}
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
                  onKeyDown={(event) => handleMenuKeyDown(event, index)}
                >
                  <div className="hq-nav-heading">
                    <Link
                      href={group.href}
                      aria-current={isActive(group.href) ? "page" : undefined}
                      onClick={() => {
                        setOpenDropdown(null);
                        setMenuOpen(false);
                      }}
                    >
                      {group.label}
                    </Link>
                    <button
                      type="button"
                      className="hq-chevron"
                      ref={(el) => {
                        toggleRefs.current[index] = el;
                      }}
                      aria-label={`${group.label} menu`}
                      aria-haspopup="menu"
                      aria-expanded={dropdownOpen}
                      aria-controls={`hq-menu-${index}`}
                      onClick={() => {
                        clearHoverTimer();
                        setOpenDropdown(dropdownOpen ? null : index);
                      }}
                    >
                      <Icon path={ICONS.chevron} />
                    </button>
                  </div>
                  <div
                    className="hq-dropdown"
                    id={`hq-menu-${index}`}
                    role="menu"
                    aria-label={`${group.label} links`}
                    hidden={!dropdownOpen}
                  >
                    <div className="hq-dropdown-label">
                      <Icon path={GroupIcon} />
                      {group.label}
                    </div>
                    <ul>
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
                            <Icon path={ICONS.arrow} size={13} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
            {mobileSignOutSlot}
          </ul>
        </nav>

        <div className="hq-actions">
          <span className="hq-action-divider" aria-hidden="true" />
          {accountSlot}
          <button
            type="button"
            className="hq-nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="hq-navigation"
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            onClick={() => {
              setMenuOpen((open) => !open);
              setOpenDropdown(null);
            }}
          >
            <span />
          </button>
        </div>
      </div>

      <div className="hq-status-bar">
        <div className="hq-status-inner">
          <span className="hq-live-label">
            <span className="hq-live-dot" aria-hidden="true" />
            League intel
          </span>
          <div className="hq-status-scroll" aria-hidden="true">
            {statusTrack("a")}
            {statusTrack("b")}
          </div>
        </div>
      </div>
    </header>
  );
}
