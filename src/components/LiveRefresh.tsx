"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const EVERY_MS = 5000;

/**
 * Keeps the page in step with the other phones courtside. Re-fetches the
 * server render every few seconds while on screen, and at once when the phone
 * is picked back up -- the moment someone is about to log a game.
 *
 * ponytail: polling, not push. Pooled Postgres endpoints cannot LISTEN, and a
 * handful of phones is nothing to a refresh every five seconds. Revisit with
 * SSE on an unpooled connection if the group or the payload grows a lot.
 */
export function LiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = setInterval(refresh, EVERY_MS);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [router]);

  return null;
}
