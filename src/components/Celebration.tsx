"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "./Avatar";
import type { Honor } from "@/lib/domain/streaks";
import {
  HONOR_STREAK_LENGTH,
  type Match,
  type Player,
  winningScore,
  losingScore,
} from "@/lib/domain/types";

/**
 * The moment the app exists for. Shown once, right after the match that
 * completed a run of three; dismissing it drops the query param so a refresh
 * does not replay it.
 */
export function Celebration({
  honor,
  players,
  matches,
}: {
  honor: Honor;
  players: Player[];
  matches: Match[];
}) {
  const [open, setOpen] = useState(true);
  const router = useRouter();

  const run = useMemo(() => {
    const end = matches.findIndex((m) => m.id === honor.matchId);
    if (end === -1) return [];
    return matches.slice(Math.max(0, end - HONOR_STREAK_LENGTH + 1), end + 1);
  }, [matches, honor.matchId]);

  const margin = run.reduce((sum, m) => sum + winningScore(m) - losingScore(m), 0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const close = () => {
    setOpen(false);
    // Drop only ?nyr= so a reload does not replay the run -- keeping ?kvold=
    // so dismissing does not bounce you off the evening you were looking at.
    const params = new URLSearchParams(window.location.search);
    params.delete("nyr");
    const query = params.toString();
    router.replace(window.location.pathname + (query ? `?${query}` : ""));
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Þrír í röð"
      className="fixed inset-0 z-50 overflow-y-auto bg-shuttle"
    >
      <Confetti />
      <div className="relative mx-auto flex min-h-full max-w-[420px] flex-col justify-center px-6 py-10">
        <div className="animate-pop-in text-center">
          <div className="mx-auto flex size-28 items-center justify-center rounded-full bg-surface">
            <ShuttleBurst />
          </div>

          <h1 className="display mt-6 text-[4.5rem] leading-[0.9] text-ink">
            Þrír í röð!
          </h1>
          <p className="display mt-2 text-2xl tracking-[0.04em] text-ink">
            Meistarar vallarins
          </p>
          <p className="mt-1 text-sm font-medium text-ink">
            {honor.nth > 1
              ? `${honor.nth * HONOR_STREAK_LENGTH} leikja yfirburðir`
              : "3 leikja yfirburðir"}
          </p>
        </div>

        <div className="card animate-rise mt-7 p-4">
          <div className="grid grid-cols-2 divide-x divide-line">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex flex-col items-center gap-2 px-3 py-2"
              >
                <Avatar player={player} size="lg" />
                <span className="display text-center text-xl text-ink">
                  {player.shortName}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <span className="eyebrow">Sigrarnir</span>
            <div className="flex gap-1.5">
              {run.map((match) => (
                <span
                  key={match.id}
                  className="display tnum rounded bg-win px-2 py-1 text-lg text-tape"
                >
                  {winningScore(match)}–{losingScore(match)}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-2 text-right text-xs text-ink-faint">
            +{margin} stiga munur samtals
          </p>
        </div>

        <div className="card animate-rise mt-3 p-4">
          <p className="display text-xl text-ink">
            Regla Badd Boys: parið verður nú að splittast!
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            {players.map((p) => p.shortName).join(" og ")} geta ekki spilað saman
            í næsta leik. Til hamingju með sigurhrinuna — nú er kominn tími til
            að blanda í spilin.
          </p>
          <p className="mt-3 border-t border-line pt-3 text-xs text-ink-muted">
            +1 „Þrír í röð“ heiðursmerki bætt á báða leikmenn.
          </p>
        </div>

        <button
          type="button"
          onClick={close}
          className="display mt-5 w-full rounded-lg bg-ink text-xl tracking-[0.04em] text-shuttle"
          style={{ height: "3.5rem" }}
        >
          Splitta pari & stofna næsta leik
        </button>
      </div>
    </div>
  );
}

function ShuttleBurst() {
  return (
    <svg width="72" height="72" viewBox="0 0 512 512" aria-hidden>
      <g transform="translate(256 280)">
        <g fill="none" stroke="#16201a" strokeWidth="19" strokeLinecap="round">
          <path d="M0 -18 L-96 -186" />
          <path d="M0 -18 L-50 -204" />
          <path d="M0 -18 L0 -212" />
          <path d="M0 -18 L50 -204" />
          <path d="M0 -18 L96 -186" />
        </g>
        <path
          d="M-70 -140 Q0 -112 70 -140"
          fill="none"
          stroke="#1f7a4d"
          strokeWidth="15"
          strokeLinecap="round"
        />
        <circle cy="14" r="62" fill="#1f7a4d" />
      </g>
    </svg>
  );
}

const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i % 9) * 0.13,
  duration: 2.4 + ((i * 7) % 12) / 10,
  color: i % 3 === 0 ? "#1f7a4d" : i % 3 === 1 ? "#1d4f96" : "#ffffff",
  size: 5 + (i % 4) * 2,
}));

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {CONFETTI.map((bit, i) => (
        <span
          key={i}
          className="absolute top-[-8%] rounded-[1px]"
          style={{
            left: `${bit.left}%`,
            width: bit.size,
            height: bit.size * 2.2,
            background: bit.color,
            opacity: 0.85,
            animation: `fall ${bit.duration}s linear ${bit.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          8% { opacity: .9; }
          100% { transform: translateY(112vh) rotate(540deg); opacity: .15; }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-hidden] span { animation: none !important; display: none; }
        }
      `}</style>
    </div>
  );
}
