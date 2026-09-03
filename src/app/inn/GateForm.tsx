"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { enterGroupCode } from "../actions";

export function GateForm({ next }: { next: string }) {
  const [state, action] = useActionState(enterGroupCode, null);

  return (
    <form action={action} className="card p-5">
      <label htmlFor="code" className="eyebrow">
        Hópkóði
      </label>
      <input
        id="code"
        name="code"
        type="text"
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        required
        autoFocus
        className="display mt-2 w-full rounded-lg border border-line bg-surface-input px-4 py-3.5 text-center text-2xl tracking-[0.2em] text-ink outline-none focus:border-challenge"
      />
      <input type="hidden" name="naest" value={next} />

      {state && !state.ok ? (
        <p className="mt-3 text-center text-sm text-flame">{state.error}</p>
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
      className="display mt-4 h-13 w-full rounded-lg bg-win text-base tracking-[0.06em] text-canvas transition-opacity disabled:opacity-50"
      style={{ height: "3.25rem" }}
    >
      {pending ? "Athuga…" : "Inn á völlinn"}
    </button>
  );
}
