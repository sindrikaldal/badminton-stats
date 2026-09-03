"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeSession, updateAttendees } from "@/app/actions";
import { AddPlayerInline } from "./AddPlayerInline";
import { Avatar } from "./Avatar";
import type { Player, PlayerId } from "@/lib/domain/types";

/**
 * Late arrivals and early leavers. Folded away by default so the evening's
 * main surface stays the score pad.
 */
export function SessionAdmin({
  sessionId,
  roster,
  attendees,
  matchCount,
}: {
  sessionId: number;
  roster: Player[];
  attendees: PlayerId[];
  matchCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateAttendees, null);
  const [selected, setSelected] = useState<Set<PlayerId>>(
    () => new Set(attendees),
  );
  const [confirming, setConfirming] = useState(false);
  const [deleting, startDelete] = useTransition();
  const router = useRouter();

  const toggle = (id: PlayerId) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const destroy = () =>
    startDelete(async () => {
      const data = new FormData();
      data.set("sessionId", String(sessionId));
      await removeSession(null, data);
      router.push("/leikir");
      router.refresh();
    });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="display mt-3 w-full rounded-lg border border-line py-3 text-sm tracking-[0.06em] text-ink-muted"
      >
        {attendees.length} mættir · breyta kvöldinu
      </button>
    );
  }

  return (
    <div className="card mt-3 p-4">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Mættir í kvöld</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-ink-faint underline"
        >
          Loka
        </button>
      </div>

      <form action={action} className="mt-3">
        <ul className="space-y-1.5">
          {roster.map((player) => {
            const on = selected.has(player.id);
            return (
              <li key={player.id}>
                <button
                  type="button"
                  onClick={() => toggle(player.id)}
                  aria-pressed={on}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left ${
                    on ? "border-win/50 bg-win/10" : "border-line bg-surface-raised"
                  }`}
                >
                  <Avatar player={player} size="sm" dimmed={!on} />
                  <span
                    className={`display flex-1 truncate text-sm ${on ? "text-ink" : "text-ink-faint"}`}
                  >
                    {player.name}
                  </span>
                  <span
                    className={`display text-[11px] ${on ? "text-win" : "text-ink-faint"}`}
                  >
                    {on ? "Mættur" : "Ekki með"}
                  </span>
                </button>
                {on ? (
                  <input type="hidden" name="attendee" value={player.id} />
                ) : null}
              </li>
            );
          })}
        </ul>

        <input type="hidden" name="sessionId" value={sessionId} />

        {state && !state.ok ? (
          <p className="mt-2 text-sm text-flame">{state.error}</p>
        ) : null}
        {state?.ok ? <p className="mt-2 text-sm text-win">Vistað.</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="display mt-3 w-full rounded-lg bg-challenge py-3 text-sm text-canvas disabled:opacity-50"
        >
          {pending ? "Vista…" : "Vista mætingu"}
        </button>
      </form>

      <div className="mt-4">
        <AddPlayerInline />
      </div>

      {/* Only offered while nothing would be lost -- a mis-dated evening. */}
      {matchCount === 0 ? (
        <div className="mt-4 border-t border-line pt-4">
          {confirming ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={destroy}
                disabled={deleting}
                className="display flex-1 rounded-lg bg-flame py-2.5 text-sm text-canvas disabled:opacity-50"
              >
                {deleting ? "Eyði…" : "Já, eyða kvöldinu"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="display flex-1 rounded-lg border border-line py-2.5 text-sm text-ink-muted"
              >
                Hætta við
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="display w-full rounded-lg border border-flame/40 py-2.5 text-sm text-flame"
            >
              Eyða þessu kvöldi
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
