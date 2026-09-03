import Link from "next/link";
import type { Honor } from "@/lib/domain/streaks";
import {
  type Match,
  type Player,
  type PlayerId,
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
    <ul className="space-y-2">
      {matches.map((match) => {
        const winners = winnersOf(match);
        const losers = losersOf(match);
        const isHonor = honorMatchIds.has(match.id);
        const involvesMe =
          highlight !== undefined &&
          [...winners, ...losers].includes(highlight);
        const iWon = highlight !== undefined && winners.includes(highlight);

        return (
          <li
            key={match.id}
            className={`card overflow-hidden ${isHonor ? "glow-flame border-flame/40" : ""}`}
          >
            <Link href={`/leikur/${match.id}`} className="block">
              <div className="flex items-center justify-between border-b border-line px-3 py-2">
                <span className="eyebrow">
                  {showDate && dates?.get(match.sessionId)
                    ? dates.get(match.sessionId)
                    : `Leikur ${match.seq}`}
                </span>
                {isHonor ? (
                  <span className="display rounded border border-flame/50 bg-flame/10 px-2 py-0.5 text-[11px] tracking-[0.1em] text-flame">
                    Þrír í röð
                  </span>
                ) : involvesMe ? (
                  <span
                    className={`display text-[11px] tracking-[0.1em] ${iWon ? "text-win" : "text-ink-faint"}`}
                  >
                    {iWon ? "Sigur" : "Tap"}
                  </span>
                ) : null}
              </div>

              <div className="divide-y divide-line/60">
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
    <div className="relative flex items-center justify-between gap-3 px-3 py-2.5">
      {won ? (
        <span className="absolute inset-y-0 left-0 w-[3px] bg-win" aria-hidden />
      ) : null}
      <span
        className={`display truncate text-base ${
          won ? "text-ink" : "text-ink-faint"
        } ${emphasised ? "underline decoration-challenge decoration-2 underline-offset-4" : ""}`}
      >
        {names}
      </span>
      <span
        className={`display tnum text-xl ${won ? "text-win" : "text-ink-faint"}`}
      >
        {score}
      </span>
    </div>
  );
}
