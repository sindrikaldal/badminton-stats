import { Avatar } from "./Avatar";
import type { NightLine, NightStats } from "@/lib/domain/night";
import { formatPercent } from "@/lib/domain/stats";
import {
  type Match,
  type Player,
  type PlayerId,
  losersOf,
  losingScore,
  marginOf,
  winnersOf,
  winningScore,
} from "@/lib/domain/types";

/**
 * The evening, once it is over. Not a modal: the night can be reopened and
 * closed again, so this is simply what the closed session looks like, and it
 * recomputes if a missing match turns up later.
 *
 * Awards can be shared. Two players who partnered all night finish level on
 * every key, and inventing a winner between them would be indefensible -- so
 * every tile here reads as comfortably with two names as with one.
 */
export function NightSummary({
  stats,
  players,
}: {
  stats: NightStats;
  players: Player[];
}) {
  if (stats.matches === 0) return null;

  const byId = new Map(players.map((p) => [p.id, p]));
  const name = (id: PlayerId) => byId.get(id)?.shortName ?? "?";
  const names = (ids: readonly PlayerId[]) => ids.map(name).join(" & ");
  const lineOf = (id: PlayerId) =>
    stats.lines.find((l) => l.playerId === id) ?? null;

  const best = stats.playerOfTheNight[0]
    ? lineOf(stats.playerOfTheNight[0])
    : null;
  const shared = stats.playerOfTheNight.length > 1;

  // When a duo shares the award they are, by definition, also the night's best
  // pair with the same record -- so the pair tile would restate the headline
  // word for word.
  const heroes = new Set(stats.playerOfTheNight);
  const pair =
    stats.pairOfTheNight &&
    !(shared && stats.pairOfTheNight.players.every((id) => heroes.has(id)))
      ? stats.pairOfTheNight
      : null;

  return (
    <>
      {best ? (
        <div className="card glow-win mt-3 p-4">
          <p className="eyebrow">Maður kvöldsins</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex -space-x-3">
              {stats.playerOfTheNight.map((id) => {
                const player = byId.get(id);
                return player ? (
                  <Avatar key={id} player={player} size="lg" />
                ) : null;
              })}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={`display text-ink ${
                  shared ? "text-lg leading-tight" : "truncate text-2xl"
                }`}
              >
                {names(stats.playerOfTheNight)}
              </p>
              <p className="text-xs text-ink-faint">
                {best.wins}S–{best.losses}T í {best.played} leikjum
              </p>
            </div>
            <p className="display tnum shrink-0 text-3xl text-win">
              {formatPercent(best.winRate)}
            </p>
          </div>
        </div>
      ) : null}

      <ul className="mt-2 space-y-2">
        {stats.biggestWin ? (
          <Award
            label="Stærsti skellurinn"
            value={scoreOf(stats.biggestWin)}
            detail={`${marginOf(stats.biggestWin)} stiga munur`}
            who={names(winnersOf(stats.biggestWin))}
            beaten={names(losersOf(stats.biggestWin))}
          />
        ) : null}

        {stats.closestGame ? (
          <Award
            label="Jafnasti leikurinn"
            value={scoreOf(stats.closestGame)}
            detail={
              winningScore(stats.closestGame) > 11
                ? `${totalPoints(stats.closestGame)} stig · framlengt`
                : `${totalPoints(stats.closestGame)} stig spiluð`
            }
            who={names(winnersOf(stats.closestGame))}
            beaten={names(losersOf(stats.closestGame))}
          />
        ) : null}

        {pair ? (
          <Award
            label="Kvöldparið"
            value={`${pair.wins}–${pair.played - pair.wins}`}
            detail={`${formatPercent(pair.winRate)} í ${pair.played} leikjum`}
            who={names(pair.players)}
          />
        ) : null}
      </ul>

      <Swings stats={stats} names={names} lineOf={lineOf} />

      <ul className="card mt-2 divide-y divide-line/60">
        {stats.lines.map((line) => {
          const player = byId.get(line.playerId);
          if (!player) return null;
          const idle = line.played === 0;

          return (
            <li
              key={line.playerId}
              className="flex items-center gap-3 px-3 py-2.5"
            >
              <Avatar player={player} size="sm" dimmed={idle} />
              <div className="min-w-0 flex-1">
                <p
                  className={`display truncate text-sm ${
                    idle ? "text-ink-faint" : "text-ink"
                  }`}
                >
                  {player.shortName}
                </p>
                <p className="truncate text-[11px] text-ink-faint">
                  {idle
                    ? "Mætti en spilaði ekki"
                    : `lengsta hrina ${line.bestStreak} · ${signed(line.avgMargin)}`}
                </p>
              </div>
              {idle ? null : (
                <p
                  className={`display tnum shrink-0 text-base ${
                    line.wins > line.losses ? "text-win" : "text-ink-muted"
                  }`}
                >
                  {line.wins}–{line.losses}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

/**
 * Both ends of the same tile, so the stat can swing either way rather than
 * only ever naming a loser. On a short night only one player may clear the
 * four-match bar, in which case that end appears alone.
 */
function Swings({
  stats,
  names,
  lineOf,
}: {
  stats: NightStats;
  names: (ids: readonly PlayerId[]) => string;
  lineOf: (id: PlayerId) => NightLine | null;
}) {
  if (stats.faded.length === 0 && stats.warmedUp.length === 0) return null;

  const row = (ids: PlayerId[], label: string, tone: string) => {
    const half = ids[0] ? lineOf(ids[0])?.half : null;
    if (!half) return null;
    return (
      <div className="flex items-baseline justify-between gap-3 py-1">
        <div className="min-w-0">
          <p className="eyebrow">{label}</p>
          <p className="display truncate text-base text-ink">{names(ids)}</p>
        </div>
        <p className={`display tnum shrink-0 text-lg ${tone}`}>
          {half.first.wins}–{half.first.losses} → {half.second.wins}–
          {half.second.losses}
        </p>
      </div>
    );
  };

  return (
    <div className="card mt-2 divide-y divide-line/60 px-4 py-2">
      {row(stats.warmedUp, "Hitnaði", "text-win")}
      {row(stats.faded, "Dofnaði", "text-flame")}
    </div>
  );
}

function Award({
  label,
  value,
  detail,
  who,
  beaten,
}: {
  label: string;
  value: string;
  detail: string;
  who: string;
  beaten?: string;
}) {
  return (
    <li className="card p-4">
      <p className="eyebrow">{label}</p>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <p className="display tnum text-3xl text-win">{value}</p>
        <p className="text-right text-xs text-ink-faint">{detail}</p>
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        <span className="display text-ink">{who}</span>
        {beaten ? <> gegn {beaten}</> : null}
      </p>
    </li>
  );
}

const scoreOf = (m: Match) => `${winningScore(m)}–${losingScore(m)}`;
const totalPoints = (m: Match) => m.scoreA + m.scoreB;
const signed = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}`;
