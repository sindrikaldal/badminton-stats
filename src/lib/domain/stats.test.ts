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
    // Still counted, so the page can say how many evenings are still wanted.
    expect(kari?.fadeSessions).toBe(3);
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

describe("mætingarkóngur", () => {
  const attendanceRecord = (sessions: Session[], eligible: PlayerId[]) =>
    seasonStats(sessions, ROSTER.concat(DAVID), new Set(eligible)).records.find(
      (r) => r.kind === "attendance-streak",
    );

  const evening = (id: number, playedOn: string, attendees: PlayerId[]) =>
    session(id, playedOn, [won([KARI, ARNAR], [BIRKIR, GISLI])], attendees);

  it("crowns the longest run of evenings turned up to", () => {
    const record = attendanceRecord(
      [
        evening(1, "2026-01-07", [KARI, ARNAR, BIRKIR, GISLI]),
        // Only Kári makes it out in the second week.
        evening(2, "2026-01-14", [KARI]),
        evening(3, "2026-01-21", [KARI, ARNAR, BIRKIR, GISLI]),
        evening(4, "2026-01-28", [KARI, ARNAR, BIRKIR, GISLI]),
      ],
      ROSTER,
    );

    expect(record?.value).toBe("4");
    expect(record?.players).toEqual([KARI]);
  });

  it("shares the crown when two have the same run", () => {
    const record = attendanceRecord(
      [
        evening(1, "2026-01-07", [KARI, BIRKIR, GISLI]),
        // Gísli skips the second week, leaving two sharing the longest run.
        evening(2, "2026-01-14", [KARI, BIRKIR]),
      ],
      [KARI, BIRKIR, GISLI],
    );

    expect(record?.players).toEqual([KARI, BIRKIR]);
  });

  it("stays quiet while nobody has missed an evening", () => {
    // Early in a season everyone has a perfect run, and a crown the whole
    // group shares says nothing about anyone.
    const record = attendanceRecord(
      [
        evening(1, "2026-01-07", ROSTER),
        evening(2, "2026-01-14", ROSTER),
        evening(3, "2026-01-21", ROSTER),
      ],
      ROSTER,
    );

    expect(record).toBeUndefined();
  });

  it("never crowns a guest, however faithfully they turn up", () => {
    const every = [KARI, ARNAR, BIRKIR, GISLI, DAVID];
    const record = attendanceRecord(
      [
        evening(1, "2026-01-07", [DAVID, ARNAR]),
        evening(2, "2026-01-14", every),
        evening(3, "2026-01-21", every),
      ],
      ROSTER,
    );

    // Davíð turned up three weeks running; Arnar is the longest-serving regular.
    expect(record?.players).toEqual([ARNAR]);
    expect(record?.value).toBe("3");
  });
});

describe("7-0", () => {
  const recordOf = (
    stats: ReturnType<typeof seasonStats>,
    kind: string,
  ) => stats.records.find((r) => r.kind === kind);

  it("always takes stærsti sigurinn, even against a wider margin", () => {
    const stats = seasonStats(
      [
        session(1, "2026-01-07", [
          won([KARI, ARNAR], [BIRKIR, GISLI], 11, 1),
          won([BIRKIR, GISLI], [KARI, ARNAR], 7, 0),
        ]),
      ],
      ROSTER,
    );

    const biggest = recordOf(stats, "biggest-win");
    expect(biggest?.value).toBe("7–0");
    expect(biggest?.players).toEqual([BIRKIR, GISLI]);
  });

  it("gives the record to the earliest of several 7-0s", () => {
    const first = won([KARI, ARNAR], [BIRKIR, GISLI], 7, 0);
    const second = won([BIRKIR, GISLI], [KARI, ARNAR], 7, 0);
    const stats = seasonStats(
      [session(1, "2026-01-07", [first, second])],
      ROSTER,
    );

    expect(recordOf(stats, "biggest-win")?.matchId).toBe(first.id);
  });

  it("keeps the real points in the tallies", () => {
    const stats = seasonStats(
      [session(1, "2026-01-07", [won([KARI, ARNAR], [BIRKIR, GISLI], 7, 0)])],
      ROSTER,
    );
    const kari = stats.players.find((p) => p.playerId === KARI);

    expect(kari?.pointsFor).toBe(7);
    expect(kari?.pointsAgainst).toBe(0);
    expect(kari?.avgMargin).toBe(7);
  });

  it("counts 7-0s given and taken per player", () => {
    const stats = seasonStats(
      [
        session(1, "2026-01-07", [
          won([KARI, ARNAR], [BIRKIR, GISLI], 7, 0),
          won([KARI, GISLI], [ARNAR, BIRKIR], 7, 0),
          won([KARI, ARNAR], [BIRKIR, GISLI], 11, 3),
        ]),
      ],
      ROSTER,
    );
    const by = (id: PlayerId) => stats.players.find((p) => p.playerId === id);

    expect(by(KARI)?.sevenNil).toEqual({ given: 2, taken: 0 });
    expect(by(BIRKIR)?.sevenNil).toEqual({ given: 0, taken: 2 });
    expect(by(ARNAR)?.sevenNil).toEqual({ given: 1, taken: 1 });
  });

  it("has no flest 7-0 record until one has happened", () => {
    const stats = seasonStats(
      [session(1, "2026-01-07", [won([KARI, ARNAR], [BIRKIR, GISLI])])],
      ROSTER,
    );

    expect(recordOf(stats, "most-seven-nil")).toBeUndefined();
  });

  it("names whoever has taken the most 7-0s, shared on a tie", () => {
    const stats = seasonStats(
      [
        session(1, "2026-01-07", [
          won([KARI, ARNAR], [BIRKIR, GISLI], 7, 0),
          won([KARI, GISLI], [ARNAR, BIRKIR], 7, 0),
        ]),
      ],
      ROSTER,
    );

    const record = recordOf(stats, "most-seven-nil");
    expect(record?.value).toBe("2");
    expect(record?.players).toEqual([BIRKIR]);

    const tied = seasonStats(
      [session(1, "2026-01-07", [won([KARI, ARNAR], [BIRKIR, GISLI], 7, 0)])],
      ROSTER,
    );
    expect(recordOf(tied, "most-seven-nil")?.players).toEqual([BIRKIR, GISLI]);
  });

  it("never names a guest for flest 7-0, though the guest's own count stands", () => {
    const roster = [...ROSTER, DAVID];
    const stats = seasonStats(
      [
        session(1, "2026-01-07", [
          won([KARI, ARNAR], [DAVID, GISLI], 7, 0),
          won([KARI, ARNAR], [DAVID, BIRKIR], 7, 0),
        ]),
      ],
      roster,
      new Set(ROSTER),
    );

    expect(recordOf(stats, "most-seven-nil")?.players).toEqual([BIRKIR, GISLI]);
    expect(stats.players.find((p) => p.playerId === DAVID)?.sevenNil.taken).toBe(2);
  });
});
