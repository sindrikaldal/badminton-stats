"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { editMatch, removeMatch } from "@/app/actions";
import { Avatar } from "./Avatar";
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
      <form action={action} className="card p-4">
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { label: "Lið A", tone: "win", indices: [0, 1], score: scoreA, set: setScoreA },
              { label: "Lið B", tone: "challenge", indices: [2, 3], score: scoreB, set: setScoreB },
            ] as const
          ).map((side) => (
            <div key={side.label}>
              <p className="eyebrow text-center">{side.label}</p>
              <div className="mt-2 space-y-1.5">
                {side.indices.map((index) => {
                  const player = slots[index] ? byId.get(slots[index]!) : null;
                  return (
                    <div
                      key={index}
                      className={`flex h-11 items-center justify-center rounded-lg border px-2 ${
                        player
                          ? side.tone === "win"
                            ? "border-win/40 bg-surface-raised"
                            : "border-challenge/40 bg-surface-raised"
                          : "border-dashed border-line"
                      }`}
                    >
                      <span
                        className={`display truncate text-sm ${
                          player
                            ? side.tone === "win"
                              ? "text-win"
                              : "text-challenge"
                            : "text-ink-faint"
                        }`}
                      >
                        {player?.shortName ?? "Tómt"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={99}
                value={side.score}
                onChange={(event) => side.set(Number(event.target.value))}
                aria-label={`${side.label} stig`}
                className={`display tnum mt-2 w-full rounded-lg border bg-surface-input py-2 text-center text-4xl outline-none ${
                  side.tone === "win"
                    ? "border-win/40 text-win focus:border-win"
                    : "border-challenge/40 text-challenge focus:border-challenge"
                }`}
              />
            </div>
          ))}
        </div>

        <p className="eyebrow mt-4">Leikmenn</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {candidates.map((player) => {
            const at = slots.indexOf(player.id);
            const placed = at !== -1;
            const side = at === 0 || at === 1 ? "win" : "challenge";
            return (
              <button
                key={player.id}
                type="button"
                onClick={() => place(player.id)}
                className={`display flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${
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

        {problem && complete ? (
          <p className="mt-4 text-sm text-ink-faint">{problem}</p>
        ) : null}
        {state && !state.ok ? (
          <p className="mt-4 text-sm text-flame">{state.error}</p>
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
          className="display mt-4 w-full rounded-lg bg-win text-base tracking-[0.06em] text-canvas disabled:bg-surface-raised disabled:text-ink-faint"
          style={{ height: "3.25rem" }}
        >
          {pending ? "Vista…" : "Vista breytingar"}
        </button>
      </form>

      <div className="card mt-4 border-flame/30 p-4">
        <p className="display text-base text-ink">Eyða leiknum</p>
        <p className="mt-1 text-sm text-ink-muted">
          Sigurhrinur og heiðursmerki kvöldsins reiknast upp á nýtt.
        </p>
        {confirmingDelete ? (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={destroy}
              disabled={deleting}
              className="display flex-1 rounded-lg bg-flame py-3 text-sm text-canvas disabled:opacity-50"
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
            className="display mt-3 w-full rounded-lg border border-flame/50 py-3 text-sm text-flame"
          >
            Eyða
          </button>
        )}
      </div>
    </>
  );
}

