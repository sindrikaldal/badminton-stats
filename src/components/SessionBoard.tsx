"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { logMatch } from "@/app/actions";
import { Celebration } from "./Celebration";
import { Court } from "./Court";
import { MatchList } from "./MatchList";
import { SevenNil } from "./SevenNil";
import {
  HONOR_STREAK_LENGTH,
  type Match,
  type PairKey,
  type Player,
  type PlayerId,
  pairKey,
  scoreProblem,
} from "@/lib/domain/types";
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
  shame,
  justLogged,
}: {
  sessionId: number;
  attendees: Player[];
  matches: Match[];
  holdingPair: [PlayerId, PlayerId] | null;
  mustSplit: PairKey | null;
  currentStreak: PairStreak | null;
  honorsTonight: number;
  celebrate: Honor | null;
  /** The match just logged, if it ended 7-0. Shown before any honor. */
  shame: Match | null;
  /** The match this phone just logged (`?nyr=`), so it is not announced as someone else's. */
  justLogged: number | null;
}) {
  const [state, action, pending] = useActionState(logMatch, null);

  // The humiliation takes the screen first; the honor, if the same game earned
  // one, waits underneath until it is dismissed.
  const [shaming, setShaming] = useState(shame !== null);
  useEffect(() => setShaming(shame !== null), [shame?.id]);

  // Winners keep the court, so they start on side A -- unless they have just
  // been split, in which case nobody is pre-filled. Keyed on the ids, not the
  // array: every background refresh delivers a fresh one, and resetting on it
  // would wipe a half-entered game every few seconds.
  const [held1, held2] = holdingPair ?? [null, null];
  const initial = useMemo<Slots>(() => {
    if (held1 === null || held2 === null || mustSplit) return EMPTY;
    return [held1, held2, null, null];
  }, [held1, held2, mustSplit]);

  const [slots, setSlots] = useState<Slots>(initial);
  const [scoreA, setScoreA] = useState(11);
  const [scoreB, setScoreB] = useState(0);

  const lastMatchId = matches.at(-1)?.id ?? 0;

  // A logged match re-renders the page; start the next one clean.
  useEffect(() => {
    setSlots(initial);
    setScoreA(11);
    setScoreB(0);
  }, [initial, lastMatchId]);

  // A game that lands from another phone wipes the form just like our own
  // would, so say whose it was -- or the same game gets entered again.
  const seenMatchId = useRef(lastMatchId);
  const [elsewhereId, setElsewhereId] = useState<number | null>(null);
  useEffect(() => {
    // Ids only grow, so a drop means a deletion, not a new game.
    if (lastMatchId > seenMatchId.current) {
      setElsewhereId(lastMatchId === justLogged ? null : lastMatchId);
    }
    seenMatchId.current = lastMatchId;
  }, [lastMatchId, justLogged]);
  const loggedElsewhere = matches.find((m) => m.id === elsewhereId) ?? null;

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

  const problem = scoreProblem(scoreA, scoreB);
  const canSubmit = complete && !problem && !pending;


  return (
    <>
      {shame && shaming ? (
        <SevenNil
          match={shame}
          byId={byId}
          // With no honor behind it, dismissing also drops ?nyr= so a reload
          // does not replay it. With one, the honor's own close does that.
          onClose={() => setShaming(false)}
          last={celebrate === null}
        />
      ) : celebrate ? (
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

      {loggedElsewhere ? (
        <div className="mt-4">
          <p className="eyebrow mb-2 text-challenge">
            Skráður í öðrum síma rétt í þessu
          </p>
          <MatchList matches={[loggedElsewhere]} players={attendees} />
        </div>
      ) : null}

      <form action={action} className="mt-4 first:mt-0">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="display text-[1.75rem] leading-none text-ink">
            Leikur {matches.length + 1}
          </h2>
          <p className="text-right text-xs font-medium text-ink-faint">
            {complete ? "Skiptu um leikmenn með því að ýta" : "Veldu fjóra"}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {attendees.map((player) => {
            const at = slots.indexOf(player.id);
            const placed = at !== -1;
            const side = at === 0 || at === 1 ? "a" : "b";
            return (
              <button
                key={player.id}
                type="button"
                onClick={() => place(player.id)}
                aria-pressed={placed}
                className={`display flex h-9 items-center rounded-full border-2 px-3 text-base transition-colors ${
                  placed
                    ? side === "a"
                      ? "border-win bg-win text-tape"
                      : "border-challenge bg-challenge text-tape"
                    : "border-line bg-surface text-ink"
                }`}
              >
                {player.shortName}
              </button>
            );
          })}
        </div>

        <Court
          slots={slots}
          byId={byId}
          onClear={clearSlot}
          scoreA={scoreA}
          scoreB={scoreB}
          onScoreA={setScoreA}
          onScoreB={setScoreB}
          onSwap={swapSides}
        />


        {splitViolation ? (
          <p className="mt-4 rounded-lg bg-shuttle px-3 py-2.5 text-sm font-medium text-ink">
            Þetta par vann þrjá í röð og á að splittast. Þú mátt samt skrá
            leikinn.
          </p>
        ) : null}

        {problem && complete ? (
          <p className="mt-4 text-sm text-ink-muted">{problem}</p>
        ) : null}

        {state && !state.ok ? (
          <p className="mt-4 text-sm font-medium text-danger">{state.error}</p>
        ) : null}

        <input type="hidden" name="sessionId" value={sessionId} />
        <input type="hidden" name="lastMatchId" value={lastMatchId} />
        <input type="hidden" name="a1" value={slots[0] ?? ""} />
        <input type="hidden" name="a2" value={slots[1] ?? ""} />
        <input type="hidden" name="b1" value={slots[2] ?? ""} />
        <input type="hidden" name="b2" value={slots[3] ?? ""} />
        <input type="hidden" name="scoreA" value={scoreA} />
        <input type="hidden" name="scoreB" value={scoreB} />

        <button
          type="submit"
          disabled={!canSubmit}
          className="display mt-3 w-full rounded-lg bg-shuttle text-[1.5rem] text-ink transition-colors active:bg-[#e6c22a] disabled:bg-surface-raised disabled:text-ink-faint"
          style={{ height: "3.75rem" }}
        >
          {pending
            ? "Skrái…"
            : !complete
              ? "Veldu fjóra leikmenn"
              : problem
                ? "Yfirfarðu stigin"
                : `Skrá úrslit ${scoreA}–${scoreB}`}
        </button>

        <p className="mt-2 flex flex-wrap justify-between gap-x-3 text-xs font-medium text-ink-faint">
          <span>
            {attendees.length} mættir
            {honorsTonight > 0 ? ` · ${honorsTonight}× þrír í röð` : ""}
          </span>
          <span>Upp í 11 · vinna með 2 · 7–0 klárar</span>
        </p>
      </form>
    </>
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
      className={`mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 first:mt-0 ${
        mustSplit ? "bg-shuttle" : "bg-surface"
      }`}
    >
      <span
        className={`display tnum flex size-10 shrink-0 items-center justify-center rounded-lg text-[1.625rem] ${
          mustSplit
            ? "bg-ink text-shuttle"
            : onFire
              ? "bg-shuttle text-ink"
              : "bg-surface-raised text-ink-muted"
        }`}
      >
        {length}
      </span>
      <div className="min-w-0">
        <p className="display truncate text-lg leading-tight text-ink">{names}</p>
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
