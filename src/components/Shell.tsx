import Link from "next/link";
import { BottomNav } from "./BottomNav";
import { CourtMark } from "./CourtMark";

export function Shell({
  children,
  status,
}: {
  children: React.ReactNode;
  /** Small line under the wordmark: the live season or evening. */
  status?: string;
}) {
  // A flex column rather than a fixed nav: on first launch as a home-screen
  // app, iOS positions fixed elements against a stale viewport and the nav
  // lands below the fold until something scrolls. In flow, with the main area
  // taking the slack, it is laid out with the content and stuck to the bottom.
  return (
    <div className="flex min-h-dvh flex-col">
      <header
        className="sticky top-0 z-30 border-b border-line bg-canvas"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex max-w-[480px] items-center gap-3 px-4 py-2.5">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <CourtMark />
            <span className="min-w-0">
              <span className="display block text-[1.625rem] leading-none text-ink">
                Badd Boys
              </span>
              {status ? (
                <span className="mt-1 block truncate text-xs font-medium text-ink-faint">
                  {status}
                </span>
              ) : null}
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[480px] flex-1 px-4 pt-4 pb-8">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}

/** Page-level section heading. */
export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mt-8 mb-3 flex items-end justify-between gap-3 first:mt-2">
      <h2 className="display text-[1.375rem] leading-none text-ink">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card p-6 text-center">
      <p className="display text-lg text-ink-muted">{title}</p>
      {children ? (
        <div className="mt-2 text-sm text-ink-faint">{children}</div>
      ) : null}
    </div>
  );
}
