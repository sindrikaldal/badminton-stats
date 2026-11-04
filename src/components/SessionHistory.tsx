import Link from "next/link";
import type { SessionSummary } from "@/lib/repo";
import { formatIcelandicDate, formatIcelandicWeekday } from "@/lib/domain/stats";
import { Arrow } from "./Arrow";

/**
 * The Kvöldið tab with nothing in progress: start a night, or step back into
 * one. Deliberately just totals -- the full match archive is the Leikir tab.
 */
export function SessionHistory({
  sessions,
  showSeason,
}: {
  sessions: SessionSummary[];
  /** Only worth the noise once a second season exists. */
  showSeason: boolean;
}) {
  return (
    <ul className="card divide-y divide-line overflow-hidden">
      {sessions.map((session) => (
        <li key={session.id}>
          <Link
            href={`/?kvold=${session.id}`}
            className={`flex items-center gap-3 px-3 py-3 ${
              session.endedAt === null ? "bg-win-dim" : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2">
                <span className="display truncate text-lg text-ink">
                  {formatIcelandicDate(session.playedOn)}
                </span>
                {session.endedAt === null ? (
                  <span className="display shrink-0 rounded border border-win/50 bg-win/10 px-1.5 py-0.5 text-xs tracking-[0.1em] text-win">
                    Í gangi
                  </span>
                ) : null}
              </p>
              <p className="truncate text-xs text-ink-faint">
                {formatIcelandicWeekday(session.playedOn)} ·{" "}
                {session.matchCount} leikir · {session.attendeeCount} mættir
                {showSeason ? ` · ${session.seasonName}` : ""}
              </p>
            </div>
            <span className="shrink-0 text-ink-faint">
              <Arrow direction="right" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
