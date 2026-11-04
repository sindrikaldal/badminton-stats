import Link from "next/link";
import { BottomNav } from "./BottomNav";
import { CourtMark } from "./CourtMark";
import { HeaderStatus } from "./HeaderStatus";
import { PageIn } from "./PageIn";

export function Shell({
  children,
  status,
  loading = false,
}: {
  children: React.ReactNode;
  /** Small line under the wordmark: the live season or evening. */
  status?: string;
  /** The skeleton shown while a page comes from the server (loading.tsx). */
  loading?: boolean;
}) {
  // Pinned to the viewport, and only <main> scrolls. As a home-screen app iOS
  // gets vh/dvh wrong by the status bar's height (WebKit bug 316008), so no
  // viewport unit may size the shell: a dvh-tall shell let the page scroll
  // under the status bar, and a dvh cap left a gap under the tab bar.
  // `inset-0` takes the real screen, and with nothing in the page flow the
  // page has nothing to scroll.
  return (
    <div className="fixed inset-0 flex flex-col">
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
              <HeaderStatus status={status} loading={loading} />
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overscroll-y-contain">
        <PageIn loading={loading} className="mx-auto w-full max-w-[480px] px-4 pt-4 pb-8">
          {children}
        </PageIn>
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
