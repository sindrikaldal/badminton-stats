"use client";

import { useState } from "react";
import { SEVEN_NIL, type Player, type PlayerId } from "@/lib/domain/types";
import { useLastChange } from "@/lib/useLastChange";

type Slots = [PlayerId | null, PlayerId | null, PlayerId | null, PlayerId | null];

/**
 * The score pad drawn as a court: a player in each service box, the two scores
 * facing each other across the net. Full bleed, like the mat on the floor.
 * Shared by logging a game and correcting one.
 *
 * In 1v1 each half has one box, filled from slots 0 and 2; 1 and 3 stay empty.
 * The court then re-lines itself as a singles court: the side tramlines draw
 * in from the net and everything steps inside them, as on a real floor.
 */
export function Court({
  slots,
  singles = false,
  byId,
  onClear,
  scoreA,
  scoreB,
  onScoreA,
  onScoreB,
  onSwap,
}: {
  slots: Slots;
  singles?: boolean;
  byId: Map<PlayerId, Player>;
  onClear: (index: number) => void;
  scoreA: number;
  scoreB: number;
  onScoreA: (value: number) => void;
  onScoreB: (value: number) => void;
  onSwap: () => void;
}) {
  const winnerSide = scoreA > scoreB ? "a" : scoreB > scoreA ? "b" : null;
  // Half-turns of the swap arrows; each press spins them once more.
  const [turns, setTurns] = useState(0);

  // Out of play in singles: the side alleys between these lines and the edge.
  const tramline = `pointer-events-none absolute inset-y-0 w-[3px] bg-tape transition-transform duration-300 ease-arrive ${
    singles ? "scale-y-100" : "scale-y-0"
  }`;

  return (
    <div className="-mx-4 mt-3 bg-court px-4 py-3">
      <div className="relative border-[3px] border-tape">
        <span aria-hidden className={`${tramline} left-2`} />
        <span aria-hidden className={`${tramline} right-2`} />

        <CourtHalf
          side="a"
          label="Lið A"
          singles={singles}
          leading={winnerSide === "a"}
          slots={singles ? [slots[0]] : [slots[0], slots[1]]}
          indices={singles ? [0] : [0, 1]}
          byId={byId}
          onClear={onClear}
          score={scoreA}
          onScore={onScoreA}
          onSevenNil={() => {
            onScoreA(SEVEN_NIL[0]);
            onScoreB(SEVEN_NIL[1]);
          }}
        />

        {/* Positioned so the net hangs over the tramlines, as it does. */}
        <div className="net relative flex h-10 items-center justify-center">
          <button
            type="button"
            onClick={() => {
              setTurns((t) => t + 1);
              onSwap();
            }}
            aria-label="Víxla liðum"
            className="flex size-11 items-center justify-center rounded-full border-[3px] border-court-deep bg-tape text-court transition-transform duration-100 active:scale-90 active:bg-shuttle"
          >
            <span
              className="flex transition-transform duration-300 ease-arrive"
              style={{ transform: `rotate(${turns * 180}deg)` }}
            >
              <SwapIcon />
            </span>
          </button>
        </div>

        <CourtHalf
          side="b"
          label="Lið B"
          singles={singles}
          leading={winnerSide === "b"}
          slots={singles ? [slots[2]] : [slots[2], slots[3]]}
          indices={singles ? [2] : [2, 3]}
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
  singles,
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
  singles: boolean;
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
  // Inside the singles tramlines (8px out, 3px wide) with the usual 10px clear.
  const inset = `transition-[padding] duration-300 ease-arrive ${
    singles ? "px-[21px]" : "px-2.5"
  }`;
  const shortcut =
    "display h-8 rounded-lg border-2 border-tape px-3 text-sm tracking-[0.04em] text-tape transition-transform duration-100 active:scale-95 active:bg-tape active:text-court";
  const stepper =
    "display flex size-12 items-center justify-center rounded-lg text-[2rem] transition-transform duration-100 active:scale-90";

  const backAlley = (
    <div className={`flex h-11 items-center justify-between gap-2 border-tape ${line} ${inset}`}>
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
    <div
      className={`grid border-tape ${slots.length === 1 ? "grid-cols-1" : "grid-cols-2"} ${line}`}
    >
      {slots.map((playerId, i) => {
        const player = playerId ? byId.get(playerId) : null;
        return (
          <button
            key={indices[i]}
            type="button"
            onClick={() => player && onClear(indices[i])}
            className={`flex h-12 items-center justify-center px-2 text-tape ${
              i === 0 && slots.length > 1 ? "border-r-[3px] border-tape" : ""
            }`}
          >
            {player ? (
              // Keyed on the player, so whoever takes the box walks on from the net.
              <span
                key={player.id}
                className={`display truncate text-[1.375rem] ${
                  side === "a" ? "animate-step-up" : "animate-step-down"
                }`}
              >
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
    <div className={`flex items-center justify-between py-1.5 ${inset}`}>
      <button
        type="button"
        onClick={() => onScore(Math.max(0, score - 1))}
        aria-label={`${label}: eitt stig af`}
        className={`${stepper} border-[3px] border-tape text-tape active:bg-court-deep`}
      >
        −
      </button>
      <Score value={score} leading={leading} label={label} />
      <button
        type="button"
        onClick={() => onScore(Math.min(99, score + 1))}
        aria-label={`${label}: eitt stig á`}
        className={`${stepper} bg-tape text-court active:bg-shuttle`}
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

/** The score at the net, rolling like a scoreboard digit when it changes. */
function Score({
  value,
  leading,
  label,
}: {
  value: number;
  leading: boolean;
  label: string;
}) {
  const moved = useLastChange(value);
  return (
    <output
      aria-label={`${label}: stig`}
      className={`display tnum text-[4rem] leading-[0.85] transition-colors duration-200 ${
        leading ? "text-shuttle" : "text-tape"
      }`}
    >
      <span
        key={value}
        className={`block ${
          moved === "up" ? "animate-tick-up" : moved === "down" ? "animate-tick-down" : ""
        }`}
      >
        {value}
      </span>
    </output>
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
