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
  // Pinned to the viewport, and only <main> scrolls. As a home-screen app iOS
  // reports vh/dvh taller than the app really is (WebKit bug 316008), so a
  // page-height shell left slack under the tab bar that let the whole app slide
  // up under the status bar. With nothing in the page flow, the page cannot
  // scroll. The dvh cap covers the opposite case, a stale and taller viewport
  // on first launch, so the tab bar is never laid out below the fold.
  return (
    <div className="fixed inset-0 flex max-h-dvh flex-col">
      <header
        className="shrink-0 border-b border-line bg-canvas"
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

      <main className="flex-1 overflow-y-auto overscroll-y-contain">
        <div className="mx-auto w-full max-w-[480px] px-4 pt-4 pb-8">
          {children}
        </div>
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
