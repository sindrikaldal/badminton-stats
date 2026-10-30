import Link from "next/link";
import type { Honor } from "@/lib/domain/streaks";
import {
  type Match,
  type Player,
  type PlayerId,
  isSevenNil,
  losersOf,
  losingScore,
  winnersOf,
  winningScore,
} from "@/lib/domain/types";

export function MatchList({
  matches,
  players,
  honors = [],
  highlight,
  showDate,
  dates,
}: {
  matches: Match[];
  players: Player[];
  honors?: Honor[];
  /** Renders this player's name in accent colour, for profile pages. */
  highlight?: PlayerId;
  showDate?: boolean;
  dates?: Map<number, string>;
}) {
  const byId = new Map(players.map((p) => [p.id, p]));
  const honorMatchIds = new Set(honors.map((h) => h.matchId));

  const nameOf = (ids: [PlayerId, PlayerId]) =>
    ids.map((id) => byId.get(id)?.shortName ?? "?").join(" & ");

  return (
    <ul className="card divide-y divide-line overflow-hidden">
      {matches.map((match) => {
        const winners = winnersOf(match);
        const losers = losersOf(match);
        const isHonor = honorMatchIds.has(match.id);
        const sevenNil = isSevenNil(match);
        const involvesMe =
          highlight !== undefined &&
          [...winners, ...losers].includes(highlight);
        const iWon = highlight !== undefined && winners.includes(highlight);

        return (
          <li key={match.id} className={isHonor ? "bg-[#fdf6d8]" : undefined}>
            <Link href={`/leikur/${match.id}`} className="block px-3 pt-2 pb-2.5">
              <div className="flex min-h-6 items-center justify-between gap-2">
                <span className="text-xs font-medium text-ink-faint">
                  {showDate && dates?.get(match.sessionId)
                    ? dates.get(match.sessionId)
                    : `Leikur ${match.seq}`}
                </span>
                <span className="flex items-center gap-1.5">
                  {sevenNil ? (
                    <span className="display tnum rounded bg-ink px-2 py-0.5 text-sm tracking-[0.04em] text-canvas">
                      7–0
                    </span>
                  ) : null}
                  {isHonor ? (
                    <span className="display rounded bg-shuttle px-2 py-0.5 text-sm tracking-[0.04em] text-ink">
                      Þrír í röð
                    </span>
                  ) : involvesMe ? (
                    <span
                      className={`display text-sm tracking-[0.04em] ${iWon ? "text-win" : "text-ink-faint"}`}
                    >
                      {iWon ? "Sigur" : "Tap"}
                    </span>
                  ) : null}
                </span>
              </div>

              <div>
                <Row
                  names={nameOf(winners)}
                  score={winningScore(match)}
                  won
                  emphasised={
                    highlight !== undefined && winners.includes(highlight)
                  }
                />
                <Row
                  names={nameOf(losers)}
                  score={losingScore(match)}
                  won={false}
                  emphasised={
                    highlight !== undefined && losers.includes(highlight)
                  }
                />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Row({
  names,
  score,
  won,
  emphasised,
}: {
  names: string;
  score: number;
  won: boolean;
  emphasised?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span
        className={`display truncate text-lg leading-snug ${
          won ? "text-ink" : "text-ink-faint"
        } ${emphasised ? "underline decoration-challenge decoration-2 underline-offset-4" : ""}`}
      >
        {names}
      </span>
      <span
        className={`display tnum shrink-0 text-[1.75rem] leading-none ${
          won ? "text-win" : "text-ink-faint"
        }`}
      >
        {score}
      </span>
    </div>
  );
}
