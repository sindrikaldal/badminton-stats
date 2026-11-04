"use client";

import { useLayoutEffect, useRef } from "react";
import { tabIndex } from "./BottomNav";

/** Where a page sits: which tab, how far inside it, and if it is still loading. */
type Place = { key: string; tab: number; depth: number; loading: boolean };

function placeOf(pathname: string, search: URLSearchParams, loading: boolean): Place {
  // A night, or the new-night form, is one step inside Kvöldið. Other search
  // params (a season, a sort, a just-logged game) are the same page.
  const inner = search.get("kvold") ?? (search.has("nytt") ? "nytt" : "");
  return {
    key: `${pathname}?${inner}`,
    tab: tabIndex(pathname),
    depth: pathname.split("/").filter(Boolean).length + (inner ? 1 : 0),
    loading,
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
 * A tap shows the page's skeleton at once (loading.tsx), so the skeleton is
 * what slides; the content then fades into it where it already stands.
 *
 * Nothing moves on first load, on a refresh, or when logging a game lands
 * back on the same page.
 */
export function PageIn({
  loading = false,
  className,
  children,
}: {
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const page = useRef<HTMLDivElement>(null);

  // Every commit, reading the address itself: Next has already written the
  // new URL (an insertion effect) by now, and the search-params hook would
  // stop the loading state from prerendering on the static 404 page.
  useLayoutEffect(() => {
    const place = placeOf(location.pathname, new URLSearchParams(location.search), loading);
    const from = shown;
    shown = place;
    if (!from || !page.current) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (from.key === place.key) {
      if (from.loading && !place.loading) {
        page.current.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 180,
          easing: "ease-out",
        });
      }
      return;
    }
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
  });

  return (
    <div ref={page} className={className}>
      {children}
    </div>
  );
}
