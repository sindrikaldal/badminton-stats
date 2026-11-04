"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { tabIndex } from "./BottomNav";

/** Where a page sits: which tab, and how far inside it. */
type Place = { key: string; tab: number; depth: number };

function placeOf(pathname: string, search: URLSearchParams): Place {
  // A night, or the new-night form, is one step inside Kvöldið. Other search
  // params (a season, a sort, a just-logged game) are the same page.
  const inner = search.get("kvold") ?? (search.has("nytt") ? "nytt" : "");
  return {
    key: `${pathname}?${inner}`,
    tab: tabIndex(pathname),
    depth: pathname.split("/").filter(Boolean).length + (inner ? 1 : 0),
  };
}

/** The page last shown. Module scope, since every page mounts a fresh shell. */
let shown: Place | null = null;

/**
 * Slides a page in from the side it lies on: a tab to the right comes from
 * the right, a player or a game from the right as a step inside, and going
 * back out from the left. Only the arriving page moves; the one it replaces
 * is already gone, so two pages are never on screen at once.
 *
 * Nothing moves on first load, on a refresh, or when logging a game lands
 * back on the same page.
 */
export function PageIn({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const place = placeOf(usePathname(), useSearchParams());
  const page = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const from = shown;
    shown = place;
    if (!from || from.key === place.key || !page.current) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Across tabs the tab order decides; within one, or to a game, depth does.
    const way =
      from.tab !== place.tab && from.tab !== -1 && place.tab !== -1
        ? place.tab - from.tab
        : place.depth - from.depth;
    if (way === 0) return;
    page.current.animate(
      [
        { opacity: 0, transform: `translateX(${way > 0 ? 28 : -28}px)` },
        { opacity: 1, transform: "none" },
      ],
      { duration: 280, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
    // Keyed on the page's identity: every render brings a fresh params object.
  }, [place.key]);

  return (
    <div ref={page} className={className}>
      {children}
    </div>
  );
}
