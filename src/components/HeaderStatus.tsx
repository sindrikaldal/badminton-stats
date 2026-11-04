"use client";

/** The status line last shown, held while the next page is still loading. */
let last: string | undefined;

/**
 * The small line under the wordmark. A loading page cannot know it yet, so it
 * keeps the previous page's line rather than blinking the header empty.
 */
export function HeaderStatus({
  status,
  loading = false,
}: {
  status?: string;
  loading?: boolean;
}) {
  // Client only: on the server this module is shared by every request.
  if (!loading && typeof window !== "undefined") last = status;
  // A loading header keeps its height even with nothing to hold.
  const text = loading ? (last ?? " ") : status;
  return text ? (
    <span className="mt-1 block truncate text-xs font-medium text-ink-faint">{text}</span>
  ) : null;
}
