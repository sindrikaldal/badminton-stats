"use client";

import { useMe } from "./Me";
import type { Player } from "@/lib/domain/types";

/** Lets whoever holds this phone change (or clear) who the app thinks they are. */
export function MeSwitcher({ players }: { players: Player[] }) {
  const { meId, ready, setMe } = useMe();

  if (!ready) return null;
  const me = players.find((p) => p.id === meId);

  return (
    <div className="card p-4">
      <p className="text-sm text-ink-muted">
        {me ? (
          <>
            Þetta tæki er skráð sem{" "}
            <span className="display text-ink">{me.name}</span>. Það stýrir bara
            hvaða tölur birtast fyrst.
          </>
        ) : (
          "Veldu hver þú ert til að sjá þínar tölur fyrst."
        )}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {players
          .filter((p) => p.isActive)
          .map((player) => (
            <button
              key={player.id}
              type="button"
              onClick={() => setMe(player.id === meId ? null : player.id)}
              className={`display rounded-full border px-3 py-2 text-sm ${
                player.id === meId
                  ? "border-win/60 bg-win/10 text-win"
                  : "border-line bg-surface-raised text-ink-muted"
              }`}
            >
              {player.shortName}
            </button>
          ))}
      </div>
    </div>
  );
}
