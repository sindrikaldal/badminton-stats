import { describe, expect, it } from "vitest";
import { nemesisFor, seasonStats } from "./stats";
import type { Match, PlayerId, Session } from "./types";

const KARI = 1;
const ARNAR = 2;
const BIRKIR = 3;
const GISLI = 4;
const DAVID = 5;
const STEFAN = 6;

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

const times = <T,>(n: number, make: () => T): T[] =>
  Array.from({ length: n }, make);

/** Four games in which Kári wins the first two and loses the last two. */
const fadingEvening = (id: number, playedOn: string) =>
  session(id, playedOn, [
    won([KARI, ARNAR], [BIRKIR, GISLI]),
    won([KARI, ARNAR], [BIRKIR, GISLI]),
    won([BIRKIR, GISLI], [KARI, ARNAR]),
    won([BIRKIR, GISLI], [KARI, ARNAR]),
  ]);

const statsFor = (sessions: Session[], player: PlayerId) =>
  seasonStats(sessions, ROSTER).players.find((p) => p.playerId === player);

describe("framlengingar", () => {
  it("counts a game only once the loser reached ten", () => {
    const kari = statsFor(
      [
        session(1, "2026-01-07", [
          won([KARI, ARNAR], [BIRKIR, GISLI], 12, 10),
          won([KARI, ARNAR], [BIRKIR, GISLI], 11, 9),
          won([BIRKIR, GISLI], [KARI, ARNAR], 15, 13),
        ]),
      ],
      KARI,
    );

    expect(kari?.deuce).toEqual({ played: 2, wins: 1 });
  });
});

describe("mætingarhrina", () => {
  it("carries across the summer, since a gap is not a missed evening", () => {
    const kari = statsFor(
      [
        session(1, "2026-03-11", []),
        session(2, "2026-04-15", []),
        // New season after the break.
        session(3, "2026-09-09", []),
        session(4, "2026-09-16", []),
      ],
      KARI,
    );

    expect(kari?.attendanceStreak).toBe(4);
  });

  it("breaks on an evening the group played without you", () => {
    const kari = statsFor(
      [
        session(1, "2026-03-11", []),
        session(2, "2026-03-18", [], [ARNAR, BIRKIR, GISLI]),
        session(3, "2026-03-25", []),
        session(4, "2026-04-01", []),
      ],
      KARI,
    );

    expect(kari?.attendanceStreak).toBe(2);
  });
});

describe("maður kvöldsins, over a season", () => {
  it("adds up the nights won, and credits a shared night to both", () => {
    const alone = session(1, "2026-01-07", [
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([KARI, BIRKIR], [ARNAR, GISLI]),
      won([KARI, GISLI], [ARNAR, BIRKIR]),
      won([KARI, ARNAR], [BIRKIR, GISLI]),
    ]);
    // Partners every game: level on every key, so the night is shared.
    const shared = session(2, "2026-01-14", [
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([KARI, ARNAR], [BIRKIR, GISLI]),
      won([BIRKIR, GISLI], [KARI, ARNAR]),
      won([KARI, ARNAR], [BIRKIR, GISLI]),
    ]);

    const both = [alone, shared];

    expect(statsFor(both, KARI)?.nightsWon).toBe(2);
    expect(statsFor(both, ARNAR)?.nightsWon).toBe(1);
  });
});

describe("dofnaði, over a season", () => {
  it("adds up each evening's halves rather than splitting the season", () => {
    const kari = statsFor(
      [
        fadingEvening(1, "2026-01-07"),
        fadingEvening(2, "2026-01-14"),
        fadingEvening(3, "2026-01-21"),
        fadingEvening(4, "2026-01-28"),
      ],
      KARI,
    );

    expect(kari?.fade).toEqual({
      first: { wins: 8, losses: 0 },
      second: { wins: 0, losses: 8 },
      delta: -1,
      sessions: 4,
    });
  });

  it("stays quiet until four evenings are long enough to count", () => {
    const kari = statsFor(
      [
        fadingEvening(1, "2026-01-07"),
        fadingEvening(2, "2026-01-14"),
        fadingEvening(3, "2026-01-21"),
      ],
      KARI,
    );

    expect(kari?.fade).toBeNull();
  });
});

describe("erkifjandi", () => {
  const regulars = new Set([KARI, ARNAR, BIRKIR, GISLI, STEFAN]);

  // Kári is 2-6 against Birkir, but 10-6 against Gísli overall.
  const grudge = [
    ...times(6, () => won([BIRKIR, GISLI], [KARI, ARNAR])),
    ...times(2, () => won([KARI, ARNAR], [BIRKIR, GISLI])),
    ...times(8, () => won([KARI, ARNAR], [GISLI, STEFAN])),
  ];

  it("names the opponent with the worst record against", () => {
    expect(nemesisFor(grudge, KARI, regulars)?.opponent).toBe(BIRKIR);
  });

  it("stays quiet until they have met enough times", () => {
    const twice = times(2, () => won([BIRKIR, GISLI], [KARI, ARNAR]));

    expect(nemesisFor(twice, KARI, regulars)).toBeNull();
  });

  it("never names a guest, however badly they beat you", () => {
    const withGuest = [
      ...grudge,
      ...times(8, () => won([DAVID, STEFAN], [KARI, ARNAR])),
    ];

    expect(nemesisFor(withGuest, KARI, new Set([...regulars, DAVID]))?.opponent).toBe(
      DAVID,
    );
    expect(nemesisFor(withGuest, KARI, regulars)?.opponent).toBe(BIRKIR);
  });
});
