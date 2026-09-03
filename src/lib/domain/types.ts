export type PlayerId = number;

export type Player = {
  id: PlayerId;
  name: string;
  shortName: string;
  initials: string;
  isGuest: boolean;
  isActive: boolean;
};

export type Season = {
  id: number;
  name: string;
  startedOn: string;
  endedOn: string | null;
};

/** One game: two pairs, a final score, and its position in the evening. */
export type Match = {
  id: number;
  sessionId: number;
  seq: number;
  teamA: [PlayerId, PlayerId];
  teamB: [PlayerId, PlayerId];
  scoreA: number;
  scoreB: number;
};

export type Session = {
  id: number;
  seasonId: number;
  playedOn: string;
  note: string | null;
  /** Null while the evening is still in progress. */
  endedAt: string | null;
  attendees: PlayerId[];
  matches: Match[];
};

/**
 * A pair, order-independent. Kári+Arnar and Arnar+Kári are one team, so every
 * lookup keyed by a duo goes through this.
 */
export type PairKey = string;

export function pairKey(a: PlayerId, b: PlayerId): PairKey {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export function pairMembers(key: PairKey): [PlayerId, PlayerId] {
  const [a, b] = key.split(":").map(Number);
  return [a, b];
}

export function winnersOf(match: Match): [PlayerId, PlayerId] {
  return match.scoreA > match.scoreB ? match.teamA : match.teamB;
}

export function losersOf(match: Match): [PlayerId, PlayerId] {
  return match.scoreA > match.scoreB ? match.teamB : match.teamA;
}

export function winningScore(match: Match): number {
  return Math.max(match.scoreA, match.scoreB);
}

export function losingScore(match: Match): number {
  return Math.min(match.scoreA, match.scoreB);
}

export function marginOf(match: Match): number {
  return winningScore(match) - losingScore(match);
}

export function playersOf(match: Match): PlayerId[] {
  return [...match.teamA, ...match.teamB];
}

export function didPlay(match: Match, player: PlayerId): boolean {
  return playersOf(match).includes(player);
}

export function didWin(match: Match, player: PlayerId): boolean {
  return winnersOf(match).includes(player);
}

/** The player's partner in this match, or null if they did not play. */
export function partnerOf(match: Match, player: PlayerId): PlayerId | null {
  if (match.teamA[0] === player) return match.teamA[1];
  if (match.teamA[1] === player) return match.teamA[0];
  if (match.teamB[0] === player) return match.teamB[1];
  if (match.teamB[1] === player) return match.teamB[0];
  return null;
}

/** The two players on the other side, or null if they did not play. */
export function opponentsOf(
  match: Match,
  player: PlayerId,
): [PlayerId, PlayerId] | null {
  if (match.teamA.includes(player)) return match.teamB;
  if (match.teamB.includes(player)) return match.teamA;
  return null;
}

/** Points this player's side scored, and conceded. */
export function scoreFor(match: Match, player: PlayerId): [number, number] | null {
  if (match.teamA.includes(player)) return [match.scoreA, match.scoreB];
  if (match.teamB.includes(player)) return [match.scoreB, match.scoreA];
  return null;
}

/** Did this game go to deuce -- 10-10 and on? The loser reaching ten says so. */
export function reachedDeuce(match: Match): boolean {
  return losingScore(match) >= 10;
}

export const HONOR_STREAK_LENGTH = 3;

/** A duo must have played this many games together to be ranked as a pair. */
export const MIN_PAIR_MATCHES = 3;
