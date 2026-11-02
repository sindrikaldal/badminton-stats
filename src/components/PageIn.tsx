"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

/** The path last shown. Module scope, since every page mounts a fresh shell. */
let shownPath: string | null = null;

/**
 * Settles a tab's page in when you switch to it. Only on an actual change of
 * page: logging a game remounts the same page, and fading the whole score pad
 * in after every result would read as a flicker, not an arrival. Nothing on
 * first load either, so opening the app is never a wait.
 */
export function PageIn({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const page = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const from = shownPath;
    shownPath = pathname;
    if (from === null || from === pathname || !page.current) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    page.current.animate(
      [
        { opacity: 0, transform: "translateY(6px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 240, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
  }, [pathname]);

  return (
    <div ref={page} className={className}>
      {children}
    </div>
  );
}
