"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Kvöldið", icon: FlameIcon },
  { href: "/leikir", label: "Leikir", icon: RacketIcon },
  { href: "/tolfraedi", label: "Tölfræði", icon: ChartIcon },
  { href: "/leikmenn", label: "Leikmenn", icon: PeopleIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex max-w-[480px]">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 transition-colors ${
                  active ? "text-win" : "text-ink-faint active:text-ink-muted"
                }`}
              >
                <Icon active={active} />
                <span className="display text-[11px] tracking-[0.1em]">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type IconProps = { active?: boolean };

function FlameIcon({ active }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3c.6 3.2-1.4 4.4-2.6 5.8C8 10.4 7 11.8 7 14a5 5 0 0 0 10 0c0-2.4-1.3-4-2.4-5.4-.6 1-1.3 1.6-2 1.8.4-2.6-.2-5.4-.6-7.4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.16 : 0}
      />
    </svg>
  );
}

function RacketIcon({ active }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <ellipse
        cx="14"
        cy="9"
        rx="6"
        ry="7"
        transform="rotate(28 14 9)"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.16 : 0}
      />
      <path
        d="m9 14-5 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChartIcon({ active }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <g
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.16 : 0}
      >
        <rect x="4" y="12" width="4" height="8" rx="1" />
        <rect x="10" y="7" width="4" height="13" rx="1" />
        <rect x="16" y="10" width="4" height="10" rx="1" />
      </g>
    </svg>
  );
}

function PeopleIcon({ active }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <g
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.16 : 0}
      >
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6S13.9 16 14.5 19" />
        <circle cx="17" cy="9.5" r="2.4" />
        <path d="M16 14.6c2.2-.2 3.9 1.2 4.5 4.4" />
      </g>
    </svg>
  );
}
