import Link from "next/link";
import { BottomNav } from "./BottomNav";

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
    <div className="stringbed flex min-h-dvh flex-col">
      <header
        className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex max-w-[480px] items-center gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <ShuttleMark />
            <span>
              <span className="display block text-xl leading-none text-ink">
                Badd Boys
              </span>
              {status ? (
                <span className="mt-0.5 block text-[11px] text-ink-faint">
                  {status}
                </span>
              ) : null}
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[480px] flex-1 px-4 pt-4 pb-6">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}

function ShuttleMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 512 512" aria-hidden>
      <rect width="512" height="512" rx="112" fill="#0e1526" />
      <g transform="translate(256 268)">
        <g
          fill="none"
          stroke="#38a8ff"
          strokeWidth="26"
          strokeLinecap="round"
        >
          <path d="M0 -18 L-96 -186" />
          <path d="M0 -18 L0 -212" />
          <path d="M0 -18 L96 -186" />
        </g>
        <circle cy="14" r="62" fill="#14e27a" />
      </g>
    </svg>
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
    <div className="mt-6 mb-3 flex items-end justify-between gap-3">
      <h2 className="display text-lg text-ink">{children}</h2>
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
      <p className="display text-base text-ink-muted">{title}</p>
      {children ? (
        <div className="mt-3 text-sm text-ink-faint">{children}</div>
      ) : null}
    </div>
  );
}
