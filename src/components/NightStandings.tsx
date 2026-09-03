import { Avatar } from "./Avatar";
import type { NightLine } from "@/lib/domain/night";
import type { Player, PlayerId } from "@/lib/domain/types";

/**
 * The evening as it stands, read between games. Ordered exactly like the
 * season table -- qualified first, then win rate -- so the row on top is
 * whoever would be maður kvöldsins if the night ended here.
 *
 * Everyone who turned up gets a row, including anyone yet to play: attendance
 * is explicit in this app, and "mætti, spilaði ekkert" is a real state.
 */
export function NightStandings({
  lines,
  players,
  leaders,
  qualifyThreshold,
}: {
  lines: NightLine[];
  players: Player[];
  leaders: PlayerId[];
  qualifyThreshold: number;
}) {
  const byId = new Map(players.map((p) => [p.id, p]));
  const leading = new Set(leaders);
  const anyBelowBar = lines.some((l) => l.played > 0 && !l.qualified);

  return (
    <>
      <ul className="card divide-y divide-line/60">
        {lines.map((line) => {
          const player = byId.get(line.playerId);
          if (!player) return null;
          const idle = line.played === 0;
          // One win is not a run. Two is worth pointing at.
          const hot = line.currentStreak >= 2;

          return (
            <li
              key={line.playerId}
              className="relative flex items-center gap-3 px-3 py-2.5"
            >
              {leading.has(line.playerId) ? (
                <span
                  className="absolute inset-y-0 left-0 w-[3px] rounded-l bg-win"
                  aria-hidden
                />
              ) : null}

              <Avatar player={player} size="sm" dimmed={idle} />

              <span
                className={`display min-w-0 flex-1 truncate text-sm ${
                  idle ? "text-ink-faint" : "text-ink"
                }`}
              >
                {player.shortName}
              </span>

              {hot ? (
                <span className="display shrink-0 rounded border border-flame/50 bg-flame/10 px-1.5 py-0.5 text-[10px] tracking-[0.08em] text-flame">
                  {line.currentStreak} í röð
                </span>
              ) : null}

              {idle ? (
                <span className="shrink-0 text-[11px] text-ink-faint">
                  Ekki spilað
                </span>
              ) : (
                <span
                  className={`display tnum shrink-0 text-sm ${
                    line.wins > line.losses ? "text-win" : "text-ink-muted"
                  }`}
                >
                  {line.wins}–{line.losses}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {anyBelowBar ? (
        <p className="mt-2 text-[11px] text-ink-faint">
          Þarf {qualifyThreshold === 1 ? "1 leik" : `${qualifyThreshold} leiki`}{" "}
          í kvöld til að teljast með.
        </p>
      ) : null}
    </>
  );
}
