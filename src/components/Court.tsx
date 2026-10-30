"use client";

import { SEVEN_NIL, type Player, type PlayerId } from "@/lib/domain/types";

type Slots = [PlayerId | null, PlayerId | null, PlayerId | null, PlayerId | null];

/**
 * The score pad drawn as a doubles court: four service boxes, the two scores
 * facing each other across the net. Full bleed, like the mat on the floor.
 * Shared by logging a game and correcting one.
 */
export function Court({
  slots,
  byId,
  onClear,
  scoreA,
  scoreB,
  onScoreA,
  onScoreB,
  onSwap,
}: {
  slots: Slots;
  byId: Map<PlayerId, Player>;
  onClear: (index: number) => void;
  scoreA: number;
  scoreB: number;
  onScoreA: (value: number) => void;
  onScoreB: (value: number) => void;
  onSwap: () => void;
}) {
  const winnerSide = scoreA > scoreB ? "a" : scoreB > scoreA ? "b" : null;

  return (
    <div className="-mx-4 mt-3 bg-court px-4 py-3">
      <div className="border-[3px] border-tape">
        <CourtHalf
          side="a"
          label="Lið A"
          leading={winnerSide === "a"}
          slots={[slots[0], slots[1]]}
          indices={[0, 1]}
          byId={byId}
          onClear={onClear}
          score={scoreA}
          onScore={onScoreA}
          onSevenNil={() => {
            onScoreA(SEVEN_NIL[0]);
            onScoreB(SEVEN_NIL[1]);
          }}
        />

        <div className="net flex h-10 items-center justify-center">
          <button
            type="button"
            onClick={onSwap}
            aria-label="Víxla liðum"
            className="flex size-11 items-center justify-center rounded-full border-[3px] border-court-deep bg-tape text-court active:bg-shuttle"
          >
            <SwapIcon />
          </button>
        </div>

        <CourtHalf
          side="b"
          label="Lið B"
          leading={winnerSide === "b"}
          slots={[slots[2], slots[3]]}
          indices={[2, 3]}
          byId={byId}
          onClear={onClear}
          score={scoreB}
          onScore={onScoreB}
          onSevenNil={() => {
            onScoreB(SEVEN_NIL[0]);
            onScoreA(SEVEN_NIL[1]);
          }}
        />
      </div>
    </div>
  );
}

/**
 * One side of the net, drawn as the real court: the back alley carries the
 * side's name and shortcuts, the service boxes hold the two players, and the
 * front zone by the net holds the score. Side B is the same half mirrored.
 */
function CourtHalf({
  side,
  label,
  leading,
  slots,
  indices,
  byId,
  onClear,
  score,
  onScore,
  onSevenNil,
}: {
  side: "a" | "b";
  label: string;
  leading: boolean;
  slots: (PlayerId | null)[];
  indices: number[];
  byId: Map<PlayerId, Player>;
  onClear: (index: number) => void;
  score: number;
  onScore: (value: number) => void;
  /** This side stopped the game at seven, the other on nothing. */
  onSevenNil: () => void;
}) {
  // Lines run toward the net on side A and away from it on side B.
  const line = side === "a" ? "border-b-[3px]" : "border-t-[3px]";
  const shortcut =
    "display h-8 rounded-lg border-2 border-tape px-3 text-sm tracking-[0.04em] text-tape active:bg-tape active:text-court";

  const backAlley = (
    <div className={`flex h-11 items-center justify-between gap-2 border-tape px-2.5 ${line}`}>
      <span
        className={`display rounded-lg px-2.5 py-0.5 text-base tracking-[0.04em] ${
          side === "a" ? "bg-tape text-win" : "bg-challenge text-tape"
        }`}
      >
        {label}
      </span>
      <span className="flex gap-1.5">
        <button type="button" onClick={() => onScore(11)} className={shortcut}>
          Setja 11
        </button>
        <button
          type="button"
          onClick={onSevenNil}
          aria-label={`${label} vann 7–0`}
          className={`${shortcut} tnum`}
        >
          7–0
        </button>
      </span>
    </div>
  );

  const serviceBoxes = (
    <div className={`grid grid-cols-2 border-tape ${line}`}>
      {slots.map((playerId, i) => {
        const player = playerId ? byId.get(playerId) : null;
        return (
          <button
            key={indices[i]}
            type="button"
            onClick={() => player && onClear(indices[i])}
            className={`flex h-12 items-center justify-center px-2 text-tape ${
              i === 0 ? "border-r-[3px] border-tape" : ""
            }`}
          >
            {player ? (
              <span className="display truncate text-[1.375rem]">
                {player.shortName}
              </span>
            ) : (
              <span className="text-sm font-medium">Tómt</span>
            )}
          </button>
        );
      })}
    </div>
  );

  const frontZone = (
    <div className="flex items-center justify-between px-2.5 py-1.5">
      <button
        type="button"
        onClick={() => onScore(Math.max(0, score - 1))}
        aria-label={`${label}: eitt stig af`}
        className="display flex size-12 items-center justify-center rounded-lg border-[3px] border-tape text-[2rem] text-tape active:bg-court-deep"
      >
        −
      </button>
      <output
        aria-label={`${label}: stig`}
        className={`display tnum text-[4rem] leading-[0.85] ${
          leading ? "text-shuttle" : "text-tape"
        }`}
      >
        {score}
      </output>
      <button
        type="button"
        onClick={() => onScore(Math.min(99, score + 1))}
        aria-label={`${label}: eitt stig á`}
        className="display flex size-12 items-center justify-center rounded-lg bg-tape text-[2rem] text-court active:bg-shuttle"
      >
        +
      </button>
    </div>
  );

  return side === "a" ? (
    <div>
      {backAlley}
      {serviceBoxes}
      {frontZone}
    </div>
  ) : (
    <div>
      {frontZone}
      {serviceBoxes}
      {backAlley}
    </div>
  );
}

function SwapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 4v15l-3-3M16 20V5l3 3"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
