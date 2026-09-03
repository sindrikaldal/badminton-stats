"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePlayer, setPlayerActive } from "@/app/actions";
import type { Player } from "@/lib/domain/types";

/**
 * Removing someone from the roster. What is on offer depends entirely on how
 * much history they have:
 *
 * - no matches at all -> delete outright (the mistyped-guest case)
 * - has played -> archive only, since deleting would take the matches with them
 *
 * A regular player is a heavier thing to remove than a guest, so the wording
 * and the confirmation step say so.
 */
export function PlayerAdmin({
  player,
  matchCount,
}: {
  player: Player;
  matchCount: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const canDelete = matchCount === 0;

  const remove = () =>
    start(async () => {
      setError(null);
      const result = await deletePlayer(player.id);
      if (!result.ok) {
        setError(result.error);
        setConfirming(false);
        return;
      }
      router.push("/leikmenn");
      router.refresh();
    });

  const toggleArchive = () =>
    start(async () => {
      setError(null);
      const result = await setPlayerActive(player.id, !player.isActive);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });

  return (
    <div className="card mt-6 border-flame/25 p-4">
      <p className="eyebrow">Umsjón</p>

      {!player.isActive ? (
        <>
          <p className="mt-2 text-sm text-ink-muted">
            <span className="display text-ink">{player.shortName}</span> er í
            geymslu — birtist ekki þegar þú velur leikmenn, en öll fyrri úrslit
            standa.
          </p>
          <button
            type="button"
            onClick={toggleArchive}
            disabled={pending}
            className="display mt-3 w-full rounded-lg bg-win py-3 text-sm text-canvas disabled:opacity-50"
          >
            {pending ? "Vista…" : "Taka úr geymslu"}
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-ink-muted">
            {canDelete
              ? player.isGuest
                ? "Þessi gestur hefur ekki spilað neinn leik og má fjarlægja alveg."
                : "Þessi leikmaður hefur ekki spilað neinn leik og má fjarlægja alveg."
              : `Hefur spilað ${matchCount} leiki. Ekki er hægt að eyða honum án þess að eyða þeim leikjum, en þú getur sett hann í geymslu.`}
          </p>

          <button
            type="button"
            onClick={toggleArchive}
            disabled={pending}
            className="display mt-3 w-full rounded-lg border border-line py-3 text-sm text-ink-muted disabled:opacity-50"
          >
            {pending ? "Vista…" : "Setja í geymslu"}
          </button>

          {canDelete ? (
            confirming ? (
              <div className="mt-3">
                {/* A regular is a bigger deal to remove than a one-off guest. */}
                {!player.isGuest ? (
                  <p className="mb-2 rounded-lg border border-flame/40 bg-flame/10 px-3 py-2 text-sm text-flame">
                    {player.name} er fastamaður í hópnum. Ertu viss?
                  </p>
                ) : null}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={remove}
                    disabled={pending}
                    className="display flex-1 rounded-lg bg-flame py-3 text-sm text-canvas disabled:opacity-50"
                  >
                    {pending ? "Eyði…" : `Já, eyða ${player.shortName}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="display flex-1 rounded-lg border border-line py-3 text-sm text-ink-muted"
                  >
                    Hætta við
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="display mt-2 w-full rounded-lg border border-flame/50 py-3 text-sm text-flame"
              >
                Eyða leikmanni
              </button>
            )
          ) : null}
        </>
      )}

      {error ? <p className="mt-3 text-sm text-flame">{error}</p> : null}
    </div>
  );
}
