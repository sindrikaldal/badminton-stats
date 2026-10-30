"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Kvöldið", icon: ShuttleIcon },
  { href: "/leikir", label: "Leikir", icon: CourtIcon },
  { href: "/tolfraedi", label: "Tölfræði", icon: ChartIcon },
  { href: "/leikmenn", label: "Leikmenn", icon: PeopleIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 z-40 bg-ink"
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
                className={`flex h-16 flex-col items-center justify-center gap-1 border-t-[3px] transition-colors ${
                  active
                    ? "border-shuttle text-shuttle"
                    : "border-transparent text-[#9aa59e] active:text-tape"
                }`}
              >
                <Icon active={active} />
                <span className="display text-[0.8125rem] tracking-[0.06em]">
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

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function ShuttleIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <g {...stroke}>
        <path
          d="M7 3.5 10 15h4l3-11.5c-1.5-.6-3.2-1-5-1s-3.5.4-5 1Z"
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.2 : 0}
        />
        <path d="M12 2.6V15M9.6 3l1.2 12M14.4 3l-1.2 12M8 8.5h8" />
        <path
          d="M10 15h4v1.5a2 2 0 0 1-4 0V15Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

function CourtIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <g {...stroke}>
        <rect
          x="6"
          y="3"
          width="12"
          height="18"
          rx="1"
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.2 : 0}
        />
        <path d="M6 8.5h12M6 15.5h12M12 3v5.5M12 15.5V21" />
        <path d="M3.5 12h17" strokeWidth="2.4" />
      </g>
    </svg>
  );
}

function ChartIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <g
        {...stroke}
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.2 : 0}
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <g
        {...stroke}
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.2 : 0}
      >
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6S13.9 16 14.5 19" />
        <circle cx="17" cy="9.5" r="2.4" />
        <path d="M16 14.6c2.2-.2 3.9 1.2 4.5 4.4" />
      </g>
    </svg>
  );
}
