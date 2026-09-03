"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Player, PlayerId } from "@/lib/domain/types";

const STORAGE_KEY = "badd-boys:me";

type MeContext = {
  /** Null until read from storage, so the first paint does not flash a guess. */
  meId: PlayerId | null;
  ready: boolean;
  setMe: (id: PlayerId | null) => void;
};

const Context = createContext<MeContext>({
  meId: null,
  ready: false,
  setMe: () => {},
});

/**
 * Who is holding this phone. Personalization only -- it protects nothing and
 * anyone can change it. Lives per-device, never on the server.
 */
export function MeProvider({ children }: { children: React.ReactNode }) {
  const [meId, setMeId] = useState<PlayerId | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setMeId(Number(stored) || null);
    } catch {
      // Private browsing, or storage disabled: stay anonymous.
    }
    setReady(true);
  }, []);

  const setMe = useCallback((id: PlayerId | null) => {
    setMeId(id);
    try {
      if (id === null) window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, String(id));
    } catch {
      // Non-fatal: the choice just will not survive a reload.
    }
  }, []);

  return (
    <Context.Provider value={{ meId, ready, setMe }}>{children}</Context.Provider>
  );
}

export function useMe() {
  return useContext(Context);
}

/** Prompts for identity once, right after the group code. */
export function WhoAmI({ players }: { players: Player[] }) {
  const { meId, ready, setMe } = useMe();
  const [dismissed, setDismissed] = useState(false);

  if (!ready || meId !== null || dismissed) return null;

  return (
    <div className="animate-rise card mb-4 p-4">
      <p className="eyebrow">Hver ert þú?</p>
      <p className="mt-1 text-sm text-ink-muted">
        Við notum þetta bara til að sýna þínar tölur fyrst.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {players
          .filter((p) => !p.isGuest && p.isActive)
          .map((player) => (
            <button
              key={player.id}
              type="button"
              onClick={() => setMe(player.id)}
              className="display rounded-full border border-line bg-surface-raised px-3 py-2 text-sm text-ink transition-colors active:border-win active:text-win"
            >
              {player.shortName}
            </button>
          ))}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="mt-3 text-xs text-ink-faint underline"
      >
        Sleppa í bili
      </button>
    </div>
  );
}
