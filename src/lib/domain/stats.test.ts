import { describe, expect, it } from "vitest";
import { seasonStats } from "./stats";
import type { Match, PlayerId, Session } from "./types";

const KARI = 1;
const ARNAR = 2;
const BIRKIR = 3;
const GISLI = 4;

const ROSTER = [KARI, ARNAR, BIRKIR, GISLI];

let seq = 0;

function won(
  winners: [number, number],
  losers: [number, number],
  scoreW = 11,
  scoreL = 7,
): Match {
  seq += 1;
  return {
    id: seq,
    sessionId: 1,
    seq,
    teamA: winners,
    teamB: losers,
    scoreA: scoreW,
    scoreB: scoreL,
  };
}

function session(
  id: number,
  playedOn: string,
  matches: Match[],
  attendees: PlayerId[] = ROSTER,
): Session {
  return {
    id,
    seasonId: 1,
    playedOn,
    note: null,
    endedAt: null,
    attendees,
    matches,
  };
}

describe("season stats", () => {
  it("orders the evenings itself, so an all-time view still reads the latest", () => {
    // The all-time view concatenates one list per season, and seasons come
    // back newest first -- so the sessions arrive in the wrong order.
    const first = session(1, "2026-01-07", [
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([KARI, ARNAR], [BIRKIR, GISLI]),
    ]);
    const latest = session(2, "2026-01-14", [
      won([BIRKIR, GISLI], [KARI, ARNAR]),
    ]);

    const stats = seasonStats([latest, first], ROSTER);
    const kari = stats.players.find((p) => p.playerId === KARI);

    // Kári ended the most recent evening on a loss.
    expect(kari?.currentStreak).toBe(0);
    expect(kari?.bestStreak).toBe(2);
  });
});
