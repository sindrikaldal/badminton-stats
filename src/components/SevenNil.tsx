"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Avatar } from "./Avatar";
import {
  type Match,
  type Player,
  type PlayerId,
  losersOf,
  winnersOf,
} from "@/lib/domain/types";

/**
 * The mercy rule's moment. The mirror of Celebration: where that one crowns the
 * winners, this one names the pair who never got on the board. Shown once,
 * right after a 7-0 is logged, before any honor the same game may have earned.
 */
export function SevenNil({
  match,
  byId,
  onClose,
  last,
}: {
  match: Match;
  byId: Map<PlayerId, Player>;
  onClose: () => void;
  /**
   * Whether this is the only screen for the match. If so, dismissing drops
   * ?nyr= so a reload does not replay it; otherwise the honor behind it does.
   */
  last: boolean;
}) {
  const router = useRouter();

  const losers = losersOf(match)
    .map((id) => byId.get(id))
    .filter((p) => p !== undefined);
  const winners = winnersOf(match)
    .map((id) => byId.get(id))
    .filter((p) => p !== undefined);

  const close = () => {
    onClose();
    if (!last) return;
    const params = new URLSearchParams(window.location.search);
    params.delete("nyr");
    const query = params.toString();
    router.replace(window.location.pathname + (query ? `?${query}` : ""));
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="7–0"
      className="fixed inset-0 z-50 overflow-y-auto bg-ink text-tape"
    >
      <div className="relative mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-6 py-10">
        <div className="animate-pop-in text-center">
          <p className="display tnum text-[8rem] leading-[0.85] text-tape">
            7–0
          </p>
          <h1 className="display mt-4 text-[2.5rem] leading-none text-shuttle">
            Stöðvaðir á núlli
          </h1>
          <p className="mt-2 text-sm font-medium text-[#c9d1cb]">
            Leikurinn stöðvaður
          </p>
        </div>

        <div className="animate-rise mt-7 rounded-lg bg-[#232e27] p-4">
          <p className="eyebrow text-center text-[#c9d1cb]">Á núlli</p>
          <div className="mt-3 grid grid-cols-2 divide-x divide-[#3a463e]">
            {losers.map((player) => (
              <div
                key={player.id}
                className="flex flex-col items-center gap-2 px-3 py-2"
              >
                <Avatar player={player} size="lg" />
                <span className="display text-center text-xl text-tape">
                  {player.shortName}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[#3a463e] pt-4">
            <span className="eyebrow text-[#c9d1cb]">Gerðu það</span>
            <span className="display text-lg text-tape">
              {winners.map((p) => p.shortName).join(" & ")}
            </span>
          </div>
        </div>

        <p className="animate-rise mt-4 text-center text-sm text-[#c9d1cb]">
          Ekki eitt stig. Þetta fer í bækurnar.
        </p>

        <button
          type="button"
          onClick={close}
          className="display mt-5 w-full rounded-lg bg-shuttle text-xl tracking-[0.04em] text-ink"
          style={{ height: "3.5rem" }}
        >
          Halda áfram
        </button>
      </div>
    </div>
  );
}
