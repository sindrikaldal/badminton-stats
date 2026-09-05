import { personalStreaksInSession } from "./streaks";
import {
  type Match,
  type PairKey,
  type PlayerId,
  type Session,
  MIN_PAIR_MATCHES,
  compareThrashing,
  didPlay,
  didWin,
  marginOf,
  pairKey,
  scoreFor,
} from "./types";

/** Below this, an evening is too short to say anything about fading. */
export const FADE_MIN_MATCHES = 4;

export type HalfRecord = { wins: number; losses: number };

export type NightHalves = {
  first: HalfRecord;
  second: HalfRecord;
  /** Second-half win rate minus first-half. Negative means they faded. */
  delta: number;
};

/** One attendee's evening. Present even for someone who played nothing. */
export type NightLine = {
  playerId: PlayerId;
  played: number;
  wins: number;
  losses: number;
  winRate: number;
  pointsFor: number;
  pointsAgainst: number;
  avgMargin: number;
  /** Longest personal run tonight. */
  bestStreak: number;
  /** The run they are on right now -- zero if they lost their last game. */
  currentStreak: number;
  /** Played enough to be eligible for maður kvöldsins. */
  qualified: boolean;
  /** Null below FADE_MIN_MATCHES -- half of three games is not a trend. */
  half: NightHalves | null;
};

export type NightPair = {
  pair: PairKey;
  players: [PlayerId, PlayerId];
  played: number;
  wins: number;
  winRate: number;
};

export type NightStats = {
  matches: number;
  /** Games needed to be eligible for maður kvöldsins. */
  qualifyThreshold: number;
  /** Every attendee, ranked: qualified first, then win rate. */
  lines: NightLine[];
  /** Shared on an exact tie. Empty when nobody has played. */
  playerOfTheNight: PlayerId[];
  pairOfTheNight: NightPair | null;
  biggestWin: Match | null;
  closestGame: Match | null;
  /** Biggest drop-off, shared on a tie. Empty when nobody qualifies. */
  faded: PlayerId[];
  /** The mirror: biggest improvement. */
  warmedUp: PlayerId[];
};

/**
 * One evening, summarised: the live table during play and the card once the
 * night is closed are the same numbers, so they can never disagree.
 *
 * Matches must arrive in playing order -- halves and streaks are read off it.
 */
export function nightStats(session: Session): NightStats {
  const matches = session.matches;

  // Attendance is the roster for the night, but a match may name someone who
  // was never ticked off. Better to show them than to lose their games.
  const present = new Set<PlayerId>(session.attendees);
  for (const match of matches) {
    for (const player of [...match.teamA, ...match.teamB]) present.add(player);
  }

  const streaks = personalStreaksInSession(matches);

  const played = new Map<PlayerId, number>();
  for (const player of present) {
    played.set(player, matches.filter((m) => didPlay(m, player)).length);
  }
  const busiest = Math.max(0, ...played.values());
  // Half of whoever played most, so the bar shrinks with a short evening and
  // can never exclude everybody.
  const qualifyThreshold = Math.ceil(busiest / 2);

  const lines: NightLine[] = [...present].map((playerId) => {
    const mine = matches.filter((m) => didPlay(m, playerId));
    let wins = 0;
    let pointsFor = 0;
    let pointsAgainst = 0;

    for (const match of mine) {
      if (didWin(match, playerId)) wins += 1;
      const score = scoreFor(match, playerId);
      if (score) {
        pointsFor += score[0];
        pointsAgainst += score[1];
      }
    }

    return {
      playerId,
      played: mine.length,
      wins,
      losses: mine.length - wins,
      winRate: mine.length > 0 ? wins / mine.length : 0,
      pointsFor,
      pointsAgainst,
      avgMargin:
        mine.length > 0 ? (pointsFor - pointsAgainst) / mine.length : 0,
      bestStreak: streaks.best.get(playerId) ?? 0,
      currentStreak: streaks.current.get(playerId) ?? 0,
      qualified: mine.length >= qualifyThreshold && mine.length > 0,
      half: halvesOf(mine, playerId),
    };
  });

  lines.sort(compareLines);

  return {
    matches: matches.length,
    qualifyThreshold,
    lines,
    playerOfTheNight: bestOf(lines.filter((l) => l.qualified)),
    pairOfTheNight: pairOfTheNight(matches),
    biggestWin: pick(matches, compareThrashing),
    // Tightest margin, then the longer war: 15-13 over 11-9.
    closestGame: pick(
      matches,
      (a, b) => marginOf(b) - marginOf(a) || totalPoints(a) - totalPoints(b),
    ),
    faded: extremes(lines, -1),
    warmedUp: extremes(lines, 1),
  };
}

/**
 * The player's own first half against their own second half -- not the
 * evening's, so someone who arrived for game five still has both.
 *
 * With an odd number the middle game is dropped, keeping the halves the same
 * size so the delta is a comparison rather than an artifact of the split.
 */
function halvesOf(mine: Match[], playerId: PlayerId): NightHalves | null {
  if (mine.length < FADE_MIN_MATCHES) return null;

  const size = Math.floor(mine.length / 2);
  const tally = (games: Match[]): HalfRecord => {
    const wins = games.filter((m) => didWin(m, playerId)).length;
    return { wins, losses: games.length - wins };
  };

  const first = tally(mine.slice(0, size));
  const second = tally(mine.slice(mine.length - size));

  return { first, second, delta: second.wins / size - first.wins / size };
}

/**
 * Qualified players, best first, and everyone else after -- the same order
 * the season table uses, so "better" means one thing across the app.
 */
function compareLines(a: NightLine, b: NightLine): number {
  // Nobody who has yet to pick up a racket outranks someone who played and
  // lost -- a blank record's average margin is zero, which would beat theirs.
  const aIdle = a.played === 0;
  const bIdle = b.played === 0;
  if (aIdle !== bIdle) return aIdle ? 1 : -1;
  if (a.qualified !== b.qualified) return a.qualified ? -1 : 1;
  if (b.winRate !== a.winRate) return b.winRate - a.winRate;
  if (b.wins !== a.wins) return b.wins - a.wins;
  return b.avgMargin - a.avgMargin;
}

/**
 * Everyone level with the best line on all three keys. A dead tie is shared:
 * breaking it on player id would be deterministic and indefensible, and the
 * award would lose its authority the first time it happened out loud.
 */
function bestOf(candidates: NightLine[]): PlayerId[] {
  if (candidates.length === 0) return [];
  const best = [...candidates].sort(compareLines)[0];
  return candidates
    .filter(
      (l) =>
        l.winRate === best.winRate &&
        l.wins === best.wins &&
        l.avgMargin === best.avgMargin,
    )
    .map((l) => l.playerId)
    .sort((a, b) => a - b);
}

/** Whoever moved furthest in `direction`, ignoring anyone who did not move. */
function extremes(lines: NightLine[], direction: 1 | -1): PlayerId[] {
  const moved = lines.filter(
    (l) => l.half !== null && Math.sign(l.half.delta) === direction,
  );
  if (moved.length === 0) return [];

  const furthest = moved.reduce((best, l) =>
    l.half!.delta * direction > best.half!.delta * direction ? l : best,
  );

  return moved
    .filter((l) => l.half!.delta === furthest.half!.delta)
    .map((l) => l.playerId)
    .sort((a, b) => a - b);
}

function pairOfTheNight(matches: Match[]): NightPair | null {
  const tally = new Map<PairKey, { played: number; wins: number }>();

  const record = (a: PlayerId, b: PlayerId, won: boolean) => {
    const key = pairKey(a, b);
    const entry = tally.get(key) ?? { played: 0, wins: 0 };
    entry.played += 1;
    if (won) entry.wins += 1;
    tally.set(key, entry);
  };

  for (const match of matches) {
    const aWon = match.scoreA > match.scoreB;
    record(match.teamA[0], match.teamA[1], aWon);
    record(match.teamB[0], match.teamB[1], !aWon);
  }

  const ranked = [...tally.entries()]
    .filter(([, v]) => v.played >= MIN_PAIR_MATCHES)
    .map(([key, v]) => ({
      pair: key,
      players: key.split(":").map(Number) as [PlayerId, PlayerId],
      played: v.played,
      wins: v.wins,
      winRate: v.wins / v.played,
    }))
    .sort((a, b) => b.winRate - a.winRate || b.played - a.played);

  return ranked[0] ?? null;
}

const totalPoints = (m: Match) => m.scoreA + m.scoreB;

/** The match that wins `compare` against every other, or null if there are none. */
function pick(
  matches: Match[],
  compare: (a: Match, b: Match) => number,
): Match | null {
  if (matches.length === 0) return null;
  return matches.reduce((best, m) => (compare(m, best) > 0 ? m : best));
}
