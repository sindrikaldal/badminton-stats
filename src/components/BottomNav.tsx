"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";

const TABS = [
  { href: "/", label: "Kvöldið", icon: ShuttleIcon },
  { href: "/leikir", label: "Leikir", icon: CourtIcon },
  { href: "/tolfraedi", label: "Tölfræði", icon: ChartIcon },
  { href: "/leikmenn", label: "Leikmenn", icon: PeopleIcon },
];

/**
 * Where the yellow bar last stood. Every page draws its own shell, so the tab
 * bar is a fresh component after each navigation; module scope is what
 * survives, letting the bar slide over from the tab you came from.
 */
let barWasAt: number | null = null;

/** Which tab a path belongs to, or -1 for a page outside them (a game). */
export function tabIndex(pathname: string) {
  return TABS.findIndex(({ href }) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href),
  );
}

export function BottomNav() {
  const pathname = usePathname();
  // The tab just tapped, shown at once: the page itself can take a moment to
  // come from the server, and the tap must not look ignored meanwhile.
  const [picked, setPicked] = useState<number | null>(null);
  const here = tabIndex(pathname);
  const current = picked ?? here;
  const bar = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const from = barWasAt;
    barWasAt = current;
    if (from === null || from === current || current === -1 || !bar.current) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    bar.current.animate(
      [
        { transform: `translateX(${from * 100}%)` },
        { transform: `translateX(${current * 100}%)` },
      ],
      { duration: 340, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
  }, [current]);

  return (
    <nav
      className="shrink-0 bg-ink"
      // The full inset left a band under the labels; the home indicator only
      // needs the lower part of it kept clear.
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px) - 12px, 0px)" }}
    >
      <ul className="relative mx-auto flex max-w-[480px]">
        {current !== -1 ? (
          <span
            ref={bar}
            aria-hidden
            className="absolute top-0 left-0 h-[3px] w-1/4 bg-shuttle"
            style={{ transform: `translateX(${current * 100}%)` }}
          />
        ) : null}
        {TABS.map(({ href, label, icon: Icon }, index) => {
          const active = index === current;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                onNavigate={() => setPicked(index)}
                aria-current={index === here ? "page" : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-1.5 border-t-[3px] border-transparent transition-colors ${
                  active ? "text-shuttle" : "text-[#9aa59e] active:text-tape"
                }`}
              >
                <Icon active={active} />
                <span className="display text-[0.8125rem] leading-none tracking-[0.06em]">
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
