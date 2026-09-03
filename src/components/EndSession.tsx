"use client";

import { useActionState, useState } from "react";
import { endSession, reopenSession } from "@/app/actions";

/** Closing the night, and stepping back into a closed one. */
export function EndSession({
  sessionId,
  matchCount,
}: {
  sessionId: number;
  matchCount: number;
}) {
  const [state, action, pending] = useActionState(endSession, null);
  const [confirming, setConfirming] = useState(false);

  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="sessionId" value={sessionId} />

      {confirming ? (
        <div className="card border-win/30 p-4">
          <p className="text-sm text-ink-muted">
            {matchCount === 0
              ? "Enginn leikur var skráður í kvöld. Ljúka samt?"
              : `Ljúka kvöldinu eftir ${matchCount} leiki? Þú getur opnað það aftur síðar.`}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="display flex-1 rounded-lg bg-win py-3 text-sm text-canvas disabled:opacity-50"
            >
              {pending ? "Loka…" : "Ljúka kvöldinu"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="display flex-1 rounded-lg border border-line py-3 text-sm text-ink-muted"
            >
              Hætta við
            </button>
          </div>
          {state && !state.ok ? (
            <p className="mt-2 text-sm text-flame">{state.error}</p>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="display w-full rounded-lg border border-line py-3 text-sm tracking-[0.06em] text-ink-muted"
        >
          Ljúka kvöldinu
        </button>
      )}
    </form>
  );
}

export function ReopenSession({ sessionId }: { sessionId: number }) {
  const [state, action, pending] = useActionState(reopenSession, null);

  return (
    <form action={action} className="card mt-4 p-4">
      <p className="eyebrow">Þessu kvöldi er lokið</p>
      <p className="mt-1 text-sm text-ink-muted">
        Þú getur opnað það aftur til að skrá leik sem vantaði.
      </p>
      <input type="hidden" name="sessionId" value={sessionId} />
      <button
        type="submit"
        disabled={pending}
        className="display mt-3 w-full rounded-lg bg-challenge py-3 text-sm text-canvas disabled:opacity-50"
      >
        {pending ? "Opna…" : "Opna kvöldið aftur"}
      </button>
      {state && !state.ok ? (
        <p className="mt-2 text-sm text-flame">{state.error}</p>
      ) : null}
    </form>
  );
}
