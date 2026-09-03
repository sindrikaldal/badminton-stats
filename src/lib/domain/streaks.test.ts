import { describe, expect, it } from "vitest";
import { pairStreaksInSession, personalStreaksInSession } from "./streaks";
import { type Match, pairKey } from "./types";

const KARI = 1;
const ARNAR = 2;
const BIRKIR = 3;
const GISLI = 4;
const DAVID = 5;
const STEFAN = 6;
const JON = 7;

let seq = 0;

/** A match written from the winners' point of view: `won(teamA, teamB, 11, 7)`. */
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

describe("pair streaks", () => {
  it("awards an honor on the third consecutive win by the same pair", () => {
    const matches = [
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([KARI, ARNAR], [DAVID, STEFAN]),
      won([KARI, ARNAR], [BIRKIR, JON]),
    ];

    const { honors } = pairStreaksInSession(matches);

    expect(honors).toHaveLength(1);
    expect(honors[0].pair).toBe(pairKey(KARI, ARNAR));
    expect(honors[0].nth).toBe(1);
    expect(honors[0].matchId).toBe(matches[2].id);
  });

  it("does not award one for two wins split by a loss", () => {
    const matches = [
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([KARI, ARNAR], [DAVID, STEFAN]),
      won([DAVID, STEFAN], [KARI, ARNAR]),
      won([KARI, ARNAR], [DAVID, STEFAN]),
    ];

    expect(pairStreaksInSession(matches).honors).toHaveLength(0);
  });

  it("awards a second honor when the same pair reaches six", () => {
    const matches = Array.from({ length: 6 }, () =>
      won([KARI, ARNAR], [BIRKIR, GISLI]),
    );

    const { honors } = pairStreaksInSession(matches);

    expect(honors.map((h) => h.nth)).toEqual([1, 2]);
    expect(honors[1].matchId).toBe(matches[5].id);
  });

  it("reports the pair holding the court and the night's longest run", () => {
    const matches = [
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([KARI, ARNAR], [DAVID, STEFAN]),
      won([DAVID, STEFAN], [KARI, ARNAR]),
    ];

    const { current, longest } = pairStreaksInSession(matches);

    expect(current).toEqual({ pair: pairKey(DAVID, STEFAN), length: 1 });
    expect(longest).toEqual({ pair: pairKey(KARI, ARNAR), length: 2 });
  });

  it("keeps runs by different pairs separate", () => {
    const matches = [
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([KARI, ARNAR], [DAVID, STEFAN]),
      // Kári stays on with a new partner: the pair run restarts at one.
      won([KARI, BIRKIR], [DAVID, STEFAN]),
      won([KARI, BIRKIR], [ARNAR, GISLI]),
    ];

    expect(pairStreaksInSession(matches).honors).toHaveLength(0);
  });
});

describe("personal streaks", () => {
  it("counts nine straight wins across re-formed teams as one run", () => {
    // The real thing: a monster night where the winner keeps the court and
    // gets split away from his partner every third game.
    const matches = [
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([KARI, ARNAR], [DAVID, STEFAN]),
      won([KARI, ARNAR], [BIRKIR, JON]), // honor #1, pair split
      won([KARI, BIRKIR], [ARNAR, GISLI]),
      won([KARI, BIRKIR], [DAVID, STEFAN]),
      won([KARI, BIRKIR], [ARNAR, JON]), // honor #2, pair split
      won([KARI, DAVID], [BIRKIR, GISLI]),
      won([KARI, DAVID], [ARNAR, STEFAN]),
      won([KARI, DAVID], [BIRKIR, JON]), // honor #3, pair split
    ];

    const { honors } = pairStreaksInSession(matches);
    const { current, best } = personalStreaksInSession(matches);

    expect(honors).toHaveLength(3);
    expect(current.get(KARI)).toBe(9);
    expect(best.get(KARI)).toBe(9);
    // His partners each rode along for three.
    expect(best.get(ARNAR)).toBe(3);
    expect(best.get(BIRKIR)).toBe(3);
  });

  it("breaks a personal streak on a loss but not on a rest", () => {
    const matches = [
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      // Kári sits this one out.
      won([DAVID, STEFAN], [BIRKIR, GISLI]),
      won([KARI, ARNAR], [DAVID, STEFAN]),
      won([BIRKIR, GISLI], [KARI, ARNAR]),
    ];

    const { current, best } = personalStreaksInSession(matches);

    expect(best.get(KARI)).toBe(2);
    expect(current.get(KARI)).toBe(0);
    expect(current.get(BIRKIR)).toBe(1);
  });
});
