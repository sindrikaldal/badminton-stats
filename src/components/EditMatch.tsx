"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { editMatch, removeMatch } from "@/app/actions";
import { Court } from "./Court";
import { type Match, type Player, type PlayerId, scoreProblem } from "@/lib/domain/types";

type Slots = [PlayerId | null, PlayerId | null, PlayerId | null, PlayerId | null];

export function EditMatch({
  match,
  candidates,
  sessionId,
}: {
  match: Match;
  candidates: Player[];
  sessionId: number;
}) {
  const [state, action, pending] = useActionState(editMatch, null);
  const [slots, setSlots] = useState<Slots>([
    match.teamA[0],
    match.teamA[1],
    match.teamB[0],
    match.teamB[1],
  ]);
  const [scoreA, setScoreA] = useState(match.scoreA);
  const [scoreB, setScoreB] = useState(match.scoreB);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, startDelete] = useTransition();
  const router = useRouter();

  const byId = new Map(candidates.map((p) => [p.id, p]));
  const complete = slots.every((s) => s !== null);
  const problem = scoreProblem(scoreA, scoreB);

  const place = (playerId: PlayerId) =>
    setSlots((prev) => {
      const next = [...prev] as Slots;
      const at = next.indexOf(playerId);
      if (at !== -1) {
        next[at] = null;
        return next;
      }
      const free = next.indexOf(null);
      if (free !== -1) next[free] = playerId;
      return next;
    });

  const destroy = () =>
    startDelete(async () => {
      const data = new FormData();
      data.set("matchId", String(match.id));
      await removeMatch(null, data);
      router.push(`/?kvold=${sessionId}`);
      router.refresh();
    });

  return (
    <>
      <form action={action}>
        <p className="text-right text-xs font-medium text-ink-faint">
          {complete ? "Skiptu um leikmenn með því að ýta" : "Veldu fjóra"}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {candidates.map((player) => {
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
          onClear={(index) =>
            setSlots((prev) => {
              const next = [...prev] as Slots;
              next[index] = null;
              return next;
            })
          }
          scoreA={scoreA}
          scoreB={scoreB}
          onScoreA={setScoreA}
          onScoreB={setScoreB}
          onSwap={() => {
            setSlots(([a1, a2, b1, b2]) => [b1, b2, a1, a2]);
            setScoreA(scoreB);
            setScoreB(scoreA);
          }}
        />

        {problem && complete ? (
          <p className="mt-4 text-sm text-ink-muted">{problem}</p>
        ) : null}
        {state && !state.ok ? (
          <p className="mt-4 text-sm font-medium text-danger">{state.error}</p>
        ) : null}
        {state?.ok ? (
          <p className="mt-4 text-sm text-win">Vistað.</p>
        ) : null}

        <input type="hidden" name="matchId" value={match.id} />
        <input type="hidden" name="a1" value={slots[0] ?? ""} />
        <input type="hidden" name="a2" value={slots[1] ?? ""} />
        <input type="hidden" name="b1" value={slots[2] ?? ""} />
        <input type="hidden" name="b2" value={slots[3] ?? ""} />
        <input type="hidden" name="scoreA" value={scoreA} />
        <input type="hidden" name="scoreB" value={scoreB} />

        <button
          type="submit"
          disabled={!complete || !!problem || pending}
          className="display mt-4 w-full rounded-lg bg-shuttle text-[1.5rem] text-ink disabled:bg-surface-raised disabled:text-ink-faint"
          style={{ height: "3.75rem" }}
        >
          {pending ? "Vista…" : "Vista breytingar"}
        </button>
      </form>

      <div className="card mt-6 p-4">
        <p className="display text-xl text-ink">Eyða leiknum</p>
        <p className="mt-1 text-sm text-ink-muted">
          Sigurhrinur og heiðursmerki kvöldsins reiknast upp á nýtt.
        </p>
        {confirmingDelete ? (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={destroy}
              disabled={deleting}
              className="display flex-1 rounded-lg bg-danger py-3 text-lg text-tape disabled:opacity-50"
            >
              {deleting ? "Eyði…" : "Já, eyða"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="display flex-1 rounded-lg border border-line py-3 text-sm text-ink-muted"
            >
              Hætta við
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="display mt-3 w-full rounded-lg border border-danger/50 py-3 text-lg text-danger"
          >
            Eyða
          </button>
        )}
      </div>
    </>
  );
}

