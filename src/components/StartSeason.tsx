"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { startSeason } from "@/app/actions";

/** Winter spans two years: a September start belongs to "2026–27". */
function defaultSeasonName(today = new Date()): string {
  const year = today.getFullYear();
  const startYear = today.getMonth() >= 7 ? year : year - 1;
  return `Veturinn ${startYear}–${String(startYear + 1).slice(2)}`;
}

function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function StartSeason({ compact = false }: { compact?: boolean }) {
  const [state, action] = useActionState(startSeason, null);

  return (
    <form action={action} className="card space-y-4 p-5">
      {!compact ? (
        <p className="text-sm text-ink-muted">
          Öll kvöld og allir leikir raðast undir tímabil. Nýtt tímabil lokar því
          sem er í gangi.
        </p>
      ) : null}

      <div>
        <label htmlFor="season-name" className="eyebrow">
          Nafn tímabils
        </label>
        <input
          id="season-name"
          name="name"
          defaultValue={defaultSeasonName()}
          required
          className="display mt-2 w-full rounded-lg border border-line bg-surface-input px-4 py-3 text-lg text-ink outline-none focus:border-challenge"
        />
      </div>

      <div>
        <label htmlFor="season-start" className="eyebrow">
          Byrjar
        </label>
        <input
          id="season-start"
          name="startedOn"
          type="date"
          defaultValue={todayIso()}
          required
          className="mt-2 w-full rounded-lg border border-line bg-surface-input px-4 py-3 text-ink outline-none focus:border-challenge"
        />
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-flame">{state.error}</p>
      ) : null}

      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="display h-13 w-full rounded-lg bg-win text-base tracking-[0.06em] text-canvas disabled:opacity-50"
      style={{ height: "3.25rem" }}
    >
      {pending ? "Stofna…" : "Stofna tímabil"}
    </button>
  );
}
