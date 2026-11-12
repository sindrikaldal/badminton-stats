import {
  type NightForm,
  PROGRESS_WINDOW,
  formatIcelandicDate,
} from "@/lib/domain/stats";

const W = 320;
const H = 132;
const PAD = { top: 10, right: 8, bottom: 22, left: 22 };

/** "16. sep" -- the axis has room for a day and three letters, not a year. */
function shortDate(iso: string): string {
  const [day, month] = formatIcelandicDate(iso).split(" ");
  return `${day} ${month.slice(0, 3)}`;
}

/**
 * Points per game, evening by evening, against nobody but yourself. Each night
 * is a faint dot; the line pools the last few nights so one bad evening is a
 * dip rather than a cliff. The best night is marked, because a slump should
 * still have something to point at.
 */
export function ProgressChart({
  nights,
  best,
}: {
  nights: NightForm[];
  best: NightForm;
}) {
  const values = nights.map((n) => n.perGame);
  // A fixed floor and ceiling, so a half-point wobble is not drawn as a crash.
  const lo = Math.min(6, Math.floor(Math.min(...values)));
  const hi = Math.max(11, Math.ceil(Math.max(...values)));
  const x = (i: number) =>
    PAD.left + (i * (W - PAD.left - PAD.right)) / (nights.length - 1);
  const y = (v: number) =>
    PAD.top + ((hi - v) * (H - PAD.top - PAD.bottom)) / (hi - lo);
  const ticks = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter(
    (v) => v % 2 === 0,
  );
  const line = nights
    .map((n, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(n.trend).toFixed(1)}`)
    .join(" ");
  const last = nights[nights.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-3 w-full"
      role="img"
      aria-label={`Stig í leik á ${nights.length} kvöldum. Besta kvöldið ${formatIcelandicDate(best.playedOn)}, ${best.perGame.toFixed(1)}. Síðustu ${PROGRESS_WINDOW} kvöld ${last.trend.toFixed(1)}.`}
    >
      {ticks.map((v) => (
        <g key={v}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(v)}
            y2={y(v)}
            className="stroke-line"
            vectorEffect="non-scaling-stroke"
          />
          <text
            x={PAD.left - 6}
            y={y(v)}
            dy="0.35em"
            textAnchor="end"
            className="tnum fill-ink-faint text-[10px]"
          >
            {v}
          </text>
        </g>
      ))}

      {nights.map((n, i) =>
        n === best ? null : (
          <Dot key={n.sessionId} night={n} cx={x(i)} cy={y(n.perGame)} />
        ),
      )}

      <path
        d={line}
        fill="none"
        className="stroke-ink"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* Drawn last so the line never covers it. */}
      <Dot night={best} cx={x(nights.indexOf(best))} cy={y(best.perGame)} best />

      {[nights[0], last].map((n, i) => (
        <text
          key={n.sessionId}
          x={i === 0 ? x(0) : x(nights.length - 1)}
          y={H - 6}
          textAnchor={i === 0 ? "start" : "end"}
          className="fill-ink-faint text-[10px]"
        >
          {shortDate(n.playedOn)}
        </text>
      ))}
    </svg>
  );
}

function Dot({
  night,
  cx,
  cy,
  best = false,
}: {
  night: NightForm;
  cx: number;
  cy: number;
  best?: boolean;
}) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={best ? 5 : 3.5}
      className={best ? "fill-shuttle stroke-ink" : "fill-line-bright stroke-surface"}
      strokeWidth={best ? 1.5 : 2}
      vectorEffect="non-scaling-stroke"
    >
      <title>
        {`${formatIcelandicDate(night.playedOn)}: ${night.perGame.toFixed(1)} stig í leik, ${night.played} leikir`}
      </title>
    </circle>
  );
}
