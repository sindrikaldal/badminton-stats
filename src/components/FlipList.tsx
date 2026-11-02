"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Where each list's rows last stood, by list id. Kept at module scope because
 * logging a game redirects from a server action, which mounts the page afresh:
 * component state would forget the old order at exactly the moment it changed.
 */
const remembered = new Map<string, Map<string, number>>();

/**
 * A list whose rows glide to their new places when the order changes, so the
 * night's table re-sorting after a game reads as people moving up and down,
 * not as a reshuffle. Rows are matched by `data-key`; anything new or gone
 * simply appears or leaves. Coming back to the tab later shows what moved
 * while you were away, the same way.
 */
export function FlipList({
  id,
  className,
  children,
}: {
  /** Names the list across mounts, e.g. one evening's 1v1 table. */
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  const list = useRef<HTMLUListElement>(null);

  // Every render, not on a dependency: the rows arrive from the server and
  // only their measured positions say whether anything moved.
  useLayoutEffect(() => {
    if (!list.current) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const before = remembered.get(id);
    const now = new Map<string, number>();
    for (const row of Array.from(list.current.children) as HTMLElement[]) {
      const key = row.dataset.key;
      if (!key) continue;
      now.set(key, row.offsetTop);
      const was = before?.get(key);
      if (still || was === undefined || was === row.offsetTop) continue;
      row.animate(
        [{ transform: `translateY(${was - row.offsetTop}px)` }, { transform: "none" }],
        { duration: 480, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      );
    }
    remembered.set(id, now);
  });

  // Positioned, so each row's offsetTop is measured within the list: a run
  // strip appearing above it must not read as every row moving.
  return (
    <ul ref={list} className={`relative ${className ?? ""}`}>
      {children}
    </ul>
  );
}
