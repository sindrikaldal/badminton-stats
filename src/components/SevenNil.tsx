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
      className="fixed inset-0 z-50 overflow-y-auto bg-canvas/97 backdrop-blur-sm"
    >
      <Vignette />
      <div className="relative mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-6 py-10">
        <div className="animate-pop-in text-center">
          <p className="eyebrow text-flame">Leikurinn stöðvaður</p>

          <p className="display text-glow-flame tnum mt-4 text-[6.5rem] leading-none text-flame">
            7–0
          </p>
          <h1 className="display mt-3 text-2xl tracking-[0.12em] text-ink">
            Stöðvaðir á núlli
          </h1>
        </div>

        <div className="card animate-rise mt-7 border-flame/40 p-4">
          <p className="eyebrow text-center">Á núlli</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {losers.map((player) => (
              <div
                key={player.id}
                className="flex flex-col items-center gap-2 rounded-lg border border-flame/30 bg-surface-raised px-3 py-4"
              >
                <Avatar player={player} size="lg" />
                <span className="display text-center text-lg text-ink">
                  {player.shortName}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <span className="eyebrow">Gerðu það</span>
            <span className="display text-sm text-ink-muted">
              {winners.map((p) => p.shortName).join(" & ")}
            </span>
          </div>
        </div>

        <p className="animate-rise mt-4 text-center text-sm text-ink-muted">
          Ekki eitt stig. Þetta fer í bækurnar.
        </p>

        <button
          type="button"
          onClick={close}
          className="display mt-5 w-full rounded-lg border border-flame/60 bg-flame/10 text-base tracking-[0.06em] text-flame"
          style={{ height: "3.5rem" }}
        >
          Halda áfram
        </button>
      </div>
    </div>
  );
}

/** A slow pulse of flame at the edges: the room, not the confetti. */
function Vignette() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden
      style={{
        background:
          "radial-gradient(ellipse at center, transparent 45%, rgba(255, 122, 61, 0.18) 100%)",
        animation: "smoulder 2.6s ease-in-out infinite alternate",
      }}
    >
      <style>{`
        @keyframes smoulder {
          from { opacity: .55; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
