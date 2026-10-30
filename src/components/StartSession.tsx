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

      <div>
        <div className="flex items-baseline justify-between">
          <h3 className="display text-xl leading-none text-ink">Hverjir mættu?</h3>
          <span className="display text-lg text-win">
            {selected.size} mættir
          </span>
        </div>

        <ul className="card mt-3 divide-y divide-line overflow-hidden">
          {players.map((player) => {
            const on = selected.has(player.id);
            return (
              <li key={player.id}>
                <button
                  type="button"
                  onClick={() => toggle(player.id)}
                  aria-pressed={on}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    on ? "bg-win-dim" : "bg-surface"
                  }`}
                >
                  <Avatar player={player} dimmed={!on} />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`display block truncate text-lg ${on ? "text-ink" : "text-ink-faint"}`}
                    >
                      {player.name}
                    </span>
                    {player.isGuest ? (
                      <span className="text-xs text-ink-faint">Gestur</span>
                    ) : null}
                  </span>
                  <span
                    className={`display text-sm ${on ? "text-win" : "text-ink-faint"}`}
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
        <p className="text-sm text-danger">{state.error}</p>
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
      className="display w-full rounded-lg bg-shuttle text-[1.5rem] text-ink disabled:bg-surface-raised disabled:text-ink-faint"
      style={{ height: "3.75rem" }}
    >
      {pending ? "Byrja…" : disabled ? "Veldu a.m.k. fjóra" : "Byrja kvöldið"}
    </button>
  );
}
