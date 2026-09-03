"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPlayer } from "@/app/actions";

/**
 * Adding a guest mid-evening has to be a two-tap affair, so it lives inline.
 * It calls the action directly instead of posting a form: the roster picker
 * that renders it is itself inside a form, and forms cannot nest.
 */
export function AddPlayerInline({
  className = "",
  onAdded,
}: {
  className?: string;
  onAdded?: (playerId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isGuest, setIsGuest] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const save = () => {
    setError(null);
    startTransition(async () => {
      const result = await addPlayer({ name, isGuest });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setName("");
      setOpen(false);
      if (result.playerId !== undefined) onAdded?.(result.playerId);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`display w-full rounded-lg border border-dashed border-line-bright py-3 text-sm tracking-[0.06em] text-ink-muted ${className}`}
      >
        + Bæta við leikmanni
      </button>
    );
  }

  return (
    <div className={`rounded-lg border border-line bg-surface-raised p-3 ${className}`}>
      <label htmlFor="new-player" className="eyebrow">
        Nafn
      </label>
      <input
        id="new-player"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            save();
          }
        }}
        autoFocus
        className="mt-2 w-full rounded-lg border border-line bg-surface-input px-3 py-2.5 text-ink outline-none focus:border-challenge"
      />

      <label className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={isGuest}
          onChange={(event) => setIsGuest(event.target.checked)}
          className="size-4 accent-[#14e27a]"
        />
        Gestur
      </label>

      {error ? <p className="mt-2 text-sm text-flame">{error}</p> : null}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending || name.trim().length === 0}
          className="display flex-1 rounded-lg bg-challenge py-2.5 text-sm text-canvas disabled:opacity-40"
        >
          {pending ? "Vista…" : "Vista"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="display flex-1 rounded-lg border border-line py-2.5 text-sm text-ink-muted"
        >
          Hætta við
        </button>
      </div>
    </div>
  );
}
