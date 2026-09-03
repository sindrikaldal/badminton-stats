import {
  HONOR_STREAK_LENGTH,
  type Match,
  type PairKey,
  type PlayerId,
  didPlay,
  didWin,
  pairKey,
  winnersOf,
} from "./types";

/**
 * A pair reaching three consecutive wins. Awarded to the duo and to both
 * players. Uncapped: a pair winning six straight earns two.
 */
export type Honor = {
  pair: PairKey;
  players: [PlayerId, PlayerId];
  /** The match that completed the run. */
  matchId: number;
  /** 1 for the first honor of a run, 2 once they reach six, and so on. */
  nth: number;
};

export type PairStreak = {
  pair: PairKey;
  length: number;
};

/**
 * Streaks live inside a single evening -- they never carry across weeks.
 * `matches` must be the whole session in playing order.
 */
export function pairStreaksInSession(matches: Match[]): {
  honors: Honor[];
  /** The pair holding the court at the end, and how long they have held it. */
  current: PairStreak | null;
  longest: PairStreak | null;
} {
  const honors: Honor[] = [];
  let holding: PairKey | null = null;
  let run = 0;
  /** Counted separately from `run`, which resets each time an honor lands. */
  let sinceChange = 0;
  let longest: PairStreak | null = null;

  for (const match of matches) {
    const winners = winnersOf(match);
    const key = pairKey(winners[0], winners[1]);

    if (key === holding) {
      run += 1;
      sinceChange += 1;
    } else {
      holding = key;
      run = 1;
      sinceChange = 1;
    }

    if (!longest || sinceChange > longest.length) {
      longest = { pair: key, length: sinceChange };
    }

    if (run === HONOR_STREAK_LENGTH) {
      honors.push({
        pair: key,
        players: winners,
        matchId: match.id,
        nth: Math.floor(sinceChange / HONOR_STREAK_LENGTH),
      });
      // Reset so a pair that stays on can earn a second honor at six.
      run = 0;
    }
  }

  return {
    honors,
    current: holding ? { pair: holding, length: sinceChange } : null,
    longest,
  };
}

export type PersonalStreaks = {
  /** Consecutive wins as of the last match of the session. */
  current: Map<PlayerId, number>;
  /** The player's best run within this session. */
  best: Map<PlayerId, number>;
};

/**
 * A player's consecutive wins regardless of partner, so a night spent winning
 * with three different partners is one unbroken run. Sitting out does not break
 * a streak -- only losing does.
 */
export function personalStreaksInSession(matches: Match[]): PersonalStreaks {
  const current = new Map<PlayerId, number>();
  const best = new Map<PlayerId, number>();

  for (const match of matches) {
    for (const player of winnersOf(match)) {
      const next = (current.get(player) ?? 0) + 1;
      current.set(player, next);
      if (next > (best.get(player) ?? 0)) best.set(player, next);
    }
    for (const player of match.scoreA > match.scoreB ? match.teamB : match.teamA) {
      current.set(player, 0);
    }
  }

  return { current, best };
}

/**
 * Was this match the one that completed a three-in-a-row? Used to decide
 * whether to show the celebration after logging a result.
 */
export function honorFromMatch(
  matches: Match[],
  matchId: number,
): Honor | null {
  return (
    pairStreaksInSession(matches).honors.find((h) => h.matchId === matchId) ??
    null
  );
}

/**
 * The pair that must now be split, if the most recent match completed a run.
 * The next-match screen uses this to warn -- never to block.
 */
export function pairThatMustSplit(matches: Match[]): PairKey | null {
  if (matches.length === 0) return null;
  const last = matches[matches.length - 1];
  return honorFromMatch(matches, last.id)?.pair ?? null;
}

/** Matches this player appeared in, oldest first. */
export function matchesFor(matches: Match[], player: PlayerId): Match[] {
  return matches.filter((m) => didPlay(m, player));
}

export function winsFor(matches: Match[], player: PlayerId): number {
  return matches.filter((m) => didPlay(m, player) && didWin(m, player)).length;
}
