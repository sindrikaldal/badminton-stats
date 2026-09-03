import { describe, expect, it } from "vitest";
import { nightStats } from "./night";
import { type Match, type PlayerId, type Session, pairKey } from "./types";

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

function night(attendees: PlayerId[], matches: Match[]): Session {
  return {
    id: 1,
    seasonId: 1,
    playedOn: "2026-09-02",
    note: null,
    endedAt: null,
    attendees,
    matches,
  };
}

const lineFor = (stats: ReturnType<typeof nightStats>, player: PlayerId) =>
  stats.lines.find((l) => l.playerId === player);

describe("maður kvöldsins", () => {
  it("excludes anyone below half the busiest attendee's games", () => {
    // Jón goes 3-0 and would top any raw win-rate sort, but three games
    // against Kári's eight is not a night's work.
    const matches = [
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([KARI, BIRKIR], [ARNAR, GISLI]),
      won([KARI, BIRKIR], [ARNAR, GISLI]),
      won([KARI, BIRKIR], [ARNAR, GISLI]),
      won([JON, DAVID], [KARI, BIRKIR]),
      won([JON, DAVID], [KARI, BIRKIR]),
      won([JON, DAVID], [KARI, BIRKIR]),
    ];
    const stats = nightStats(
      night([KARI, ARNAR, BIRKIR, GISLI, JON, DAVID], matches),
    );

    expect(stats.qualifyThreshold).toBe(4);
    expect(lineFor(stats, JON)?.qualified).toBe(false);
    expect(stats.playerOfTheNight).toEqual([KARI]);
  });

  it("shares the award when two players are exactly level", () => {
    // Partners all night: identical record, identical margins, no honest way
    // to separate them.
    const matches = [
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([BIRKIR, GISLI], [KARI, ARNAR]),
      won([KARI, ARNAR], [BIRKIR, GISLI]),
    ];
    const stats = nightStats(night([KARI, ARNAR, BIRKIR, GISLI], matches));

    expect(stats.playerOfTheNight).toEqual([KARI, ARNAR]);
  });
});

describe("dofnaði og hitnaði", () => {
  it("splits a player's own matches, so a late arrival still has two halves", () => {
    // Davíð plays only games 5-8, entirely inside the evening's second half.
    // Splitting the evening would leave him no first half at all.
    const matches = [
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([JON, DAVID], [STEFAN, GISLI]),
      won([JON, DAVID], [STEFAN, GISLI]),
      won([STEFAN, GISLI], [JON, DAVID]),
      won([STEFAN, JON], [DAVID, GISLI]),
    ];
    const stats = nightStats(
      night([KARI, ARNAR, BIRKIR, GISLI, JON, DAVID, STEFAN], matches),
    );

    expect(lineFor(stats, DAVID)?.half).toEqual({
      first: { wins: 2, losses: 0 },
      second: { wins: 0, losses: 2 },
      delta: -1,
    });
    expect(stats.faded).toEqual([DAVID]);
    expect(stats.warmedUp).toEqual([STEFAN]);
  });

  it("drops the middle game when a player has an odd number of matches", () => {
    // Five games, W W W L L. Equal halves compare the first two against the
    // last two; the third is discarded so the delta is not an artifact.
    const matches = [
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([BIRKIR, GISLI], [KARI, ARNAR]),
      won([BIRKIR, GISLI], [KARI, ARNAR]),
    ];
    const stats = nightStats(night([KARI, ARNAR, BIRKIR, GISLI], matches));

    expect(lineFor(stats, KARI)?.half).toEqual({
      first: { wins: 2, losses: 0 },
      second: { wins: 0, losses: 2 },
      delta: -1,
    });
  });

  it("ignores players with fewer than four matches", () => {
    const matches = [
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([BIRKIR, GISLI], [KARI, ARNAR]),
    ];
    const stats = nightStats(night([KARI, ARNAR, BIRKIR, GISLI], matches));

    expect(lineFor(stats, KARI)?.half).toBeNull();
    expect(stats.faded).toEqual([]);
    expect(stats.warmedUp).toEqual([]);
  });
});

describe("staðan í kvöld", () => {
  it("lists every attendee, including anyone who played nothing", () => {
    const matches = [won([KARI, ARNAR], [BIRKIR, GISLI])];
    const stats = nightStats(
      night([KARI, ARNAR, BIRKIR, GISLI, JON], matches),
    );

    expect(stats.lines).toHaveLength(5);
    expect(lineFor(stats, JON)).toMatchObject({
      played: 0,
      wins: 0,
      losses: 0,
      qualified: false,
    });
  });
});

describe("kvöldparið", () => {
  it("needs three games together before a pair can win the night", () => {
    // Kári & Arnar are unbeaten but have only two games as a duo, so the
    // award falls to a pair with a worse record and enough of a sample.
    const matches = [
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([BIRKIR, GISLI], [JON, DAVID]),
    ];
    const stats = nightStats(
      night([KARI, ARNAR, BIRKIR, GISLI, JON, DAVID], matches),
    );

    expect(stats.pairOfTheNight?.pair).toBe(pairKey(BIRKIR, GISLI));
    expect(stats.pairOfTheNight?.played).toBe(3);
  });
});
