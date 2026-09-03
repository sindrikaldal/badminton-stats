"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { logMatch } from "@/app/actions";
import { Avatar } from "./Avatar";
import { Celebration } from "./Celebration";
import { HONOR_STREAK_LENGTH, type Match, type PairKey, type Player, type PlayerId, pairKey } from "@/lib/domain/types";
import type { Honor, PairStreak } from "@/lib/domain/streaks";

type Slots = [PlayerId | null, PlayerId | null, PlayerId | null, PlayerId | null];

const EMPTY: Slots = [null, null, null, null];

export function SessionBoard({
  sessionId,
  attendees,
  matches,
  holdingPair,
  mustSplit,
  currentStreak,
  honorsTonight,
  celebrate,
}: {
  sessionId: number;
  attendees: Player[];
  matches: Match[];
  holdingPair: [PlayerId, PlayerId] | null;
  mustSplit: PairKey | null;
  currentStreak: PairStreak | null;
  honorsTonight: number;
  celebrate: Honor | null;
}) {
  const [state, action, pending] = useActionState(logMatch, null);

  // Winners keep the court, so they start on side A -- unless they have just
  // been split, in which case nobody is pre-filled.
  const initial = useMemo<Slots>(() => {
    if (!holdingPair || mustSplit) return EMPTY;
    return [holdingPair[0], holdingPair[1], null, null];
  }, [holdingPair, mustSplit]);

  const [slots, setSlots] = useState<Slots>(initial);
  const [scoreA, setScoreA] = useState(11);
  const [scoreB, setScoreB] = useState(0);

  // A logged match re-renders the page; start the next one clean.
  useEffect(() => {
    setSlots(initial);
    setScoreA(11);
    setScoreB(0);
  }, [initial, matches.length]);

  const byId = useMemo(
    () => new Map(attendees.map((p) => [p.id, p])),
    [attendees],
  );

  const place = (playerId: PlayerId) => {
    setSlots((prev) => {
      const next = [...prev] as Slots;
      const at = next.indexOf(playerId);
      if (at !== -1) {
        next[at] = null;
        return next;
      }
      const free = next.indexOf(null);
      if (free === -1) return next;
      next[free] = playerId;
      return next;
    });
  };

  const clearSlot = (index: number) =>
    setSlots((prev) => {
      const next = [...prev] as Slots;
      next[index] = null;
      return next;
    });

  const swapSides = () =>
    setSlots(([a1, a2, b1, b2]) => {
      setScoreA(scoreB);
      setScoreB(scoreA);
      return [b1, b2, a1, a2];
    });

  const teamA = [slots[0], slots[1]];
  const teamB = [slots[2], slots[3]];
  const complete = slots.every((s) => s !== null);

  const pairA = teamA[0] && teamA[1] ? pairKey(teamA[0], teamA[1]) : null;
  const pairB = teamB[0] && teamB[1] ? pairKey(teamB[0], teamB[1]) : null;
  const splitViolation =
    mustSplit !== null && (pairA === mustSplit || pairB === mustSplit);

  const scoreProblem = validateScore(scoreA, scoreB);
  const canSubmit = complete && !scoreProblem && !pending;

  const winnerSide = scoreA > scoreB ? "a" : scoreB > scoreA ? "b" : null;

  return (
    <>
      {celebrate ? (
        <Celebration
          honor={celebrate}
          players={celebrate.players.map((id) => byId.get(id)).filter((p) => p !== undefined)}
          matches={matches}
        />
      ) : null}

      {currentStreak && currentStreak.length > 0 && holdingPair ? (
        <StreakBanner
          players={holdingPair.map((id) => byId.get(id)).filter((p) => p !== undefined)}
          length={currentStreak.length}
          mustSplit={mustSplit !== null}
        />
      ) : null}

      <div className="card mt-4 flex divide-x divide-line">
        <Summary value={String(matches.length)} label="Leikir í kvöld" />
        <Summary value={String(attendees.length)} label="Mættir" />
        <Summary
          value={String(honorsTonight)}
          label="Þrír í röð"
          tone={honorsTonight > 0 ? "flame" : undefined}
        />
      </div>

      <form action={action} className="card mt-3 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="eyebrow">Skrá leik {matches.length + 1}</p>
          <span className="text-[11px] text-ink-faint">
            Upp í 11 · vinna með 2
          </span>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
            <TeamColumn
              label="Lið A"
              tone="win"
              active={winnerSide === "a"}
              slots={[slots[0], slots[1]]}
              indices={[0, 1]}
              byId={byId}
              onClear={clearSlot}
              score={scoreA}
              onScore={setScoreA}
            />

            <div className="flex flex-col items-center gap-2 pt-9">
              <span className="display text-xs text-ink-faint">VS</span>
              <button
                type="button"
                onClick={swapSides}
                aria-label="Víxla liðum"
                className="rounded-lg border border-line p-2 text-ink-faint active:border-challenge active:text-challenge"
              >
                <SwapIcon />
              </button>
            </div>

            <TeamColumn
              label="Lið B"
              tone="challenge"
              active={winnerSide === "b"}
              slots={[slots[2], slots[3]]}
              indices={[2, 3]}
              byId={byId}
              onClear={clearSlot}
              score={scoreB}
              onScore={setScoreB}
            />
          </div>

          <p className="mt-4 eyebrow">
            {complete ? "Skiptu um leikmenn með því að ýta" : "Veldu fjóra"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {attendees.map((player) => {
              const at = slots.indexOf(player.id);
              const placed = at !== -1;
              const side = at === 0 || at === 1 ? "win" : "challenge";
              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => place(player.id)}
                  className={`display flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${
                    placed
                      ? side === "win"
                        ? "border-win/60 bg-win/10 text-win"
                        : "border-challenge/60 bg-challenge/10 text-challenge"
                      : "border-line bg-surface-raised text-ink-muted"
                  }`}
                >
                  <Avatar player={player} size="sm" dimmed={!placed} />
                  {player.shortName}
                </button>
              );
            })}
          </div>

          {splitViolation ? (
            <p className="mt-4 rounded-lg border border-flame/40 bg-flame/10 px-3 py-2.5 text-sm text-flame">
              Þetta par vann þrjá í röð og á að splittast. Þú mátt samt skrá
              leikinn.
            </p>
          ) : null}

          {scoreProblem && complete ? (
            <p className="mt-4 text-sm text-ink-faint">{scoreProblem}</p>
          ) : null}

          {state && !state.ok ? (
            <p className="mt-4 text-sm text-flame">{state.error}</p>
          ) : null}

          <input type="hidden" name="sessionId" value={sessionId} />
          <input type="hidden" name="a1" value={slots[0] ?? ""} />
          <input type="hidden" name="a2" value={slots[1] ?? ""} />
          <input type="hidden" name="b1" value={slots[2] ?? ""} />
          <input type="hidden" name="b2" value={slots[3] ?? ""} />
          <input type="hidden" name="scoreA" value={scoreA} />
          <input type="hidden" name="scoreB" value={scoreB} />

          <button
            type="submit"
            disabled={!canSubmit}
            className="display mt-4 w-full rounded-lg bg-win text-base tracking-[0.06em] text-canvas transition-colors disabled:bg-surface-raised disabled:text-ink-faint"
            style={{ height: "3.5rem" }}
          >
            {pending
              ? "Skrái…"
              : !complete
                ? "Veldu fjóra leikmenn"
                : scoreProblem
                  ? "Yfirfarðu stigin"
                  : `Skrá úrslit ${scoreA}–${scoreB}`}
          </button>
        </div>
      </form>
    </>
  );
}

function Summary({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone?: "flame";
}) {
  return (
    <div className="flex-1 px-3 py-3 text-center">
      <p
        className={`display tnum text-2xl ${tone === "flame" ? "text-flame" : "text-ink"}`}
      >
        {value}
      </p>
      <p className="text-[10px] tracking-[0.1em] text-ink-faint uppercase">
        {label}
      </p>
    </div>
  );
}

function validateScore(a: number, b: number): string | null {
  if (a === b) return "Leikur getur ekki endað jafn.";
  if (Math.max(a, b) < 11) return "Sigurvegari þarf a.m.k. 11 stig.";
  if (Math.abs(a - b) < 2) return "Það þarf tveggja stiga mun.";
  return null;
}

function TeamColumn({
  label,
  tone,
  active,
  slots,
  indices,
  byId,
  onClear,
  score,
  onScore,
}: {
  label: string;
  tone: "win" | "challenge";
  active: boolean;
  slots: (PlayerId | null)[];
  indices: number[];
  byId: Map<PlayerId, Player>;
  onClear: (index: number) => void;
  score: number;
  onScore: (value: number) => void;
}) {
  const accent = tone === "win" ? "text-win" : "text-challenge";
  const border = tone === "win" ? "border-win/40" : "border-challenge/40";
  const glow = tone === "win" ? "glow-win" : "glow-challenge";

  return (
    <div>
      <p className={`eyebrow text-center ${active ? accent : ""}`}>{label}</p>

      <div className="mt-2 space-y-1.5">
        {slots.map((playerId, i) => {
          const player = playerId ? byId.get(playerId) : null;
          return (
            <button
              key={indices[i]}
              type="button"
              onClick={() => player && onClear(indices[i])}
              className={`flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border px-2 ${
                player
                  ? `${border} bg-surface-raised`
                  : "border-dashed border-line bg-transparent"
              }`}
            >
              {player ? (
                <span className={`display truncate text-sm ${accent}`}>
                  {player.shortName}
                </span>
              ) : (
                <span className="text-xs text-ink-faint">Tómt</span>
              )}
            </button>
          );
        })}
      </div>

      <div
        className={`mt-2 rounded-lg border ${border} bg-surface-input py-2 ${active ? glow : ""}`}
      >
        <p
          className={`display tnum text-center text-5xl leading-none ${accent}`}
        >
          {score}
        </p>
        <p className="mt-1 text-center text-[10px] tracking-[0.14em] text-ink-faint">
          STIG
        </p>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => onScore(Math.max(0, score - 1))}
          aria-label={`${label}: eitt stig af`}
          className="display h-12 rounded-lg border border-line bg-surface-raised text-xl text-ink-muted active:border-line-bright"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => onScore(Math.min(99, score + 1))}
          aria-label={`${label}: eitt stig á`}
          className={`display h-12 rounded-lg text-xl text-canvas ${
            tone === "win" ? "bg-win" : "bg-challenge"
          }`}
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={() => onScore(11)}
        className="display mt-1.5 h-9 w-full rounded-lg border border-line text-xs tracking-[0.08em] text-ink-faint"
      >
        Setja 11
      </button>
    </div>
  );
}

function StreakBanner({
  players,
  length,
  mustSplit,
}: {
  players: Player[];
  length: number;
  mustSplit: boolean;
}) {
  const names = players.map((p) => p.shortName).join(" & ");
  const onFire = length >= 2;

  return (
    <div
      className={`card mt-4 flex items-center gap-3 p-4 ${onFire ? "glow-flame" : ""}`}
    >
      <span
        className={`display flex size-12 shrink-0 items-center justify-center rounded-lg text-xl ${
          onFire ? "bg-flame/15 text-flame" : "bg-surface-raised text-ink-muted"
        }`}
      >
        {length}
      </span>
      <div className="min-w-0">
        <p className="display truncate text-base text-ink">{names}</p>
        <p className="text-sm text-ink-muted">
          {mustSplit
            ? `${HONOR_STREAK_LENGTH} í röð — parið splittast núna`
            : length === 1
              ? "Halda vellinum"
              : `${length} í röð · ${HONOR_STREAK_LENGTH - (length % HONOR_STREAK_LENGTH)} í heiðurinn`}
        </p>
      </div>
    </div>
  );
}

function SwapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8h13l-3-3M20 16H7l3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
