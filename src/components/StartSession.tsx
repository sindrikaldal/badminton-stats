"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { startSession } from "@/app/actions";
import { Avatar } from "./Avatar";
import { AddPlayerInline } from "./AddPlayerInline";
import type { Player } from "@/lib/domain/types";

function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/**
 * Attendance is picked explicitly at the top of the evening: it scopes every
 * later player picker to the people actually in the hall.
 */
export function StartSession({
  players,
  defaultDate,
}: {
  players: Player[];
  defaultDate?: string;
}) {
  const [state, action] = useActionState(startSession, null);
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(players.filter((p) => !p.isGuest).map((p) => p.id)),
  );

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <form action={action} className="space-y-4">
      <div className="card p-5">
        <label htmlFor="played-on" className="eyebrow">
          Dagsetning
        </label>
        <input
          id="played-on"
          name="playedOn"
          type="date"
          defaultValue={defaultDate ?? todayIso()}
          required
          className="mt-2 w-full rounded-lg border border-line bg-surface-input px-4 py-3 text-ink outline-none focus:border-challenge"
        />
      </div>

      <div className="card p-5">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Hverjir mættu?</p>
          <span className="display text-sm text-win">
            {selected.size} mættir
          </span>
        </div>

        <ul className="mt-3 space-y-2">
          {players.map((player) => {
            const on = selected.has(player.id);
            return (
              <li key={player.id}>
                <button
                  type="button"
                  onClick={() => toggle(player.id)}
                  aria-pressed={on}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    on
                      ? "border-win/50 bg-win/10"
                      : "border-line bg-surface-raised"
                  }`}
                >
                  <Avatar player={player} dimmed={!on} />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`display block truncate text-base ${on ? "text-ink" : "text-ink-faint"}`}
                    >
                      {player.name}
                    </span>
                    {player.isGuest ? (
                      <span className="text-[11px] text-ink-faint">Gestur</span>
                    ) : null}
                  </span>
                  <span
                    className={`display text-xs ${on ? "text-win" : "text-ink-faint"}`}
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

        <AddPlayerInline className="mt-4" />
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-flame">{state.error}</p>
      ) : null}

      <Submit disabled={selected.size < 4} />
    </form>
  );
}

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="display w-full rounded-lg bg-win text-base tracking-[0.06em] text-canvas disabled:bg-surface-raised disabled:text-ink-faint"
      style={{ height: "3.25rem" }}
    >
      {pending ? "Byrja…" : disabled ? "Veldu a.m.k. fjóra" : "Byrja kvöldið"}
    </button>
  );
}
