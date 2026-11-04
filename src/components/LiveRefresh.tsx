"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const EVERY_MS = 5000;

/**
 * Keeps every tab in step with the other phones courtside. Asks the server
 * every few seconds for the data's fingerprint, and at once when the page
 * arrives or the phone is picked back up; only when it differs from the one
 * this page was rendered from does it re-render the page.
 *
 * Checking on arrival matters: tabs are kept prefetched (BottomNav), so one
 * shown from memory may be behind, and is brought up to date a moment later.
 * And re-rendering only on a change matters too: a refresh throws away every
 * prefetched tab, so they are fetched again only when there is news.
 *
 * ponytail: polling, not push. Pooled Postgres endpoints cannot LISTEN, and a
 * fingerprint every five seconds from a handful of phones is nothing. Revisit
 * with SSE on an unpooled connection if the group grows a lot.
 */
export function LiveRefresh({ version }: { version: string }) {
  const router = useRouter();

  useEffect(() => {
    let left = false;
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/version", { cache: "no-store" });
        const { v } = (await response.json()) as { v: string };
        if (!left && v !== version) router.refresh();
      } catch {
        // Offline, or the hall wifi dropped: the next check tries again.
      }
    };
    check();
    const timer = setInterval(check, EVERY_MS);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("online", check);
    return () => {
      left = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("online", check);
    };
  }, [router, version]);

  return null;
}
