import { pairStreaksInSession, personalStreaksInSession } from "./streaks";
import {
  type Match,
  type PairKey,
  type PlayerId,
  type Session,
  didPlay,
  didWin,
  losersOf,
  losingScore,
  marginOf,
  opponentsOf,
  pairKey,
  partnerOf,
  scoreFor,
  winnersOf,
  winningScore,
} from "./types";

/** A player must have played this share of the season's matches to be ranked. */
export const QUALIFY_SHARE = 0.25;
/** A duo must have played this many games together to appear in chemistry. */
export const MIN_PAIR_MATCHES = 3;

export type PlayerStats = {
  playerId: PlayerId;
  played: number;
  wins: number;
  losses: number;
  /** 0-1. Zero when they have not played. */
  winRate: number;
  pointsFor: number;
  pointsAgainst: number;
  /** Mean points won by, or lost by. Negative means usually on the wrong end. */
  avgMargin: number;
  honors: number;
  bestStreak: number;
  /** Their run at the end of the most recent session they played. */
  currentStreak: number;
  sessionsAttended: number;
  attendanceRate: number;
  qualified: boolean;
};

export type PairStats = {
  pair: PairKey;
  players: [PlayerId, PlayerId];
  played: number;
  wins: number;
  winRate: number;
  honors: number;
};

export type HeadToHead = {
  opponent: PlayerId;
  played: number;
  wins: number;
  winRate: number;
};

export type SeasonRecord = {
  kind:
    | "biggest-win"
    | "longest-game"
    | "busiest-night"
    | "longest-personal-streak";
  label: string;
  value: string;
  detail: string;
  sessionId: number | null;
  matchId: number | null;
  /** Whoever holds the record. */
  players: PlayerId[];
  /** Who they did it to, where that makes sense. */
  beaten?: PlayerId[];
};

export type SeasonStats = {
  totalMatches: number;
  totalSessions: number;
  qualifyThreshold: number;
  players: PlayerStats[];
  pairs: PairStats[];
  records: SeasonRecord[];
};

function allMatches(sessions: Session[]): Match[] {
  return sessions.flatMap((s) => s.matches);
}

/**
 * Everything on the season table, derived from the sessions in one pass per
 * concern. Sessions must arrive oldest-first so "current streak" means the
 * streak at the end of the latest evening.
 */
export function seasonStats(
  sessions: Session[],
  roster: PlayerId[],
): SeasonStats {
  const matches = allMatches(sessions);
  const totalMatches = matches.length;
  const totalSessions = sessions.length;
  const qualifyThreshold = Math.ceil(totalMatches * QUALIFY_SHARE);

  const honorsByPlayer = new Map<PlayerId, number>();
  const honorsByPair = new Map<PairKey, number>();
  const bestStreak = new Map<PlayerId, number>();
  const currentStreak = new Map<PlayerId, number>();

  for (const session of sessions) {
    for (const honor of pairStreaksInSession(session.matches).honors) {
      honorsByPair.set(honor.pair, (honorsByPair.get(honor.pair) ?? 0) + 1);
      for (const player of honor.players) {
        honorsByPlayer.set(player, (honorsByPlayer.get(player) ?? 0) + 1);
      }
    }

    const { best, current } = personalStreaksInSession(session.matches);
    for (const [player, run] of best) {
      if (run > (bestStreak.get(player) ?? 0)) bestStreak.set(player, run);
    }
    // Later sessions overwrite earlier ones, leaving the most recent night's
    // final run -- which is what "hrina núna" means.
    for (const [player, run] of current) currentStreak.set(player, run);
  }

  const attendance = new Map<PlayerId, number>();
  for (const session of sessions) {
    for (const player of session.attendees) {
      attendance.set(player, (attendance.get(player) ?? 0) + 1);
    }
  }

  const players: PlayerStats[] = roster.map((playerId) => {
    let played = 0;
    let wins = 0;
    let pointsFor = 0;
    let pointsAgainst = 0;

    for (const match of matches) {
      const score = scoreFor(match, playerId);
      if (!score) continue;
      played += 1;
      if (didWin(match, playerId)) wins += 1;
      pointsFor += score[0];
      pointsAgainst += score[1];
    }

    const sessionsAttended = attendance.get(playerId) ?? 0;

    return {
      playerId,
      played,
      wins,
      losses: played - wins,
      winRate: played > 0 ? wins / played : 0,
      pointsFor,
      pointsAgainst,
      avgMargin: played > 0 ? (pointsFor - pointsAgainst) / played : 0,
      honors: honorsByPlayer.get(playerId) ?? 0,
      bestStreak: bestStreak.get(playerId) ?? 0,
      currentStreak: currentStreak.get(playerId) ?? 0,
      sessionsAttended,
      attendanceRate: totalSessions > 0 ? sessionsAttended / totalSessions : 0,
      qualified: played >= qualifyThreshold && played > 0,
    };
  });

  return {
    totalMatches,
    totalSessions,
    qualifyThreshold,
    players,
    pairs: pairStats(matches, honorsByPair),
    records: seasonRecords(sessions),
  };
}

/**
 * Ranked for display: qualified players by win rate, then everyone else. Ties
 * break on total wins, so volume beats a thin sample at the same percentage.
 */
export function rankedLeaderboard(stats: PlayerStats[]): PlayerStats[] {
  return [...stats].sort((a, b) => {
    if (a.qualified !== b.qualified) return a.qualified ? -1 : 1;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.avgMargin - a.avgMargin;
  });
}

function pairStats(
  matches: Match[],
  honorsByPair: Map<PairKey, number>,
): PairStats[] {
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

  return [...tally.entries()]
    .filter(([, v]) => v.played >= MIN_PAIR_MATCHES)
    .map(([key, v]) => ({
      pair: key,
      players: key.split(":").map(Number) as [PlayerId, PlayerId],
      played: v.played,
      wins: v.wins,
      winRate: v.wins / v.played,
      honors: honorsByPair.get(key) ?? 0,
    }))
    .sort((a, b) => b.winRate - a.winRate || b.played - a.played);
}

/** This player's record against each opponent they have faced. */
export function headToHead(
  matches: Match[],
  playerId: PlayerId,
): HeadToHead[] {
  const tally = new Map<PlayerId, { played: number; wins: number }>();

  for (const match of matches) {
    const opponents = opponentsOf(match, playerId);
    if (!opponents) continue;
    const won = didWin(match, playerId);
    for (const opponent of opponents) {
      const entry = tally.get(opponent) ?? { played: 0, wins: 0 };
      entry.played += 1;
      if (won) entry.wins += 1;
      tally.set(opponent, entry);
    }
  }

  return [...tally.entries()]
    .map(([opponent, v]) => ({
      opponent,
      played: v.played,
      wins: v.wins,
      winRate: v.wins / v.played,
    }))
    .sort((a, b) => b.winRate - a.winRate);
}

/** This player's record alongside each partner they have played with. */
export function chemistryFor(
  matches: Match[],
  playerId: PlayerId,
): HeadToHead[] {
  const tally = new Map<PlayerId, { played: number; wins: number }>();

  for (const match of matches) {
    const partner = partnerOf(match, playerId);
    if (partner === null) continue;
    const entry = tally.get(partner) ?? { played: 0, wins: 0 };
    entry.played += 1;
    if (didWin(match, playerId)) entry.wins += 1;
    tally.set(partner, entry);
  }

  return [...tally.entries()]
    .map(([opponent, v]) => ({
      opponent,
      played: v.played,
      wins: v.wins,
      winRate: v.wins / v.played,
    }))
    .sort((a, b) => b.winRate - a.winRate || b.played - a.played);
}

function seasonRecords(sessions: Session[]): SeasonRecord[] {
  const matches = allMatches(sessions);
  if (matches.length === 0) return [];

  const records: SeasonRecord[] = [];
  const sessionOf = (matchId: number) =>
    sessions.find((s) => s.matches.some((m) => m.id === matchId))?.id ?? null;

  const biggest = matches.reduce((best, m) =>
    marginOf(m) > marginOf(best) ? m : best,
  );
  records.push({
    kind: "biggest-win",
    label: "Stærsti sigurinn",
    value: `${winningScore(biggest)}–${losingScore(biggest)}`,
    detail: `${marginOf(biggest)} stiga munur`,
    sessionId: sessionOf(biggest.id),
    matchId: biggest.id,
    players: [...winnersOf(biggest)],
    beaten: [...losersOf(biggest)],
  });

  // Measured in points played, so a 15-13 marathon beats a routine 11-9.
  const totalPoints = (m: Match) => m.scoreA + m.scoreB;
  const longest = matches.reduce((best, m) =>
    totalPoints(m) > totalPoints(best) ? m : best,
  );
  records.push({
    kind: "longest-game",
    label: "Lengsti leikurinn",
    value: `${winningScore(longest)}–${losingScore(longest)}`,
    detail:
      winningScore(longest) > 11
        ? `${totalPoints(longest)} stig · framlengt`
        : `${totalPoints(longest)} stig spiluð`,
    sessionId: sessionOf(longest.id),
    matchId: longest.id,
    players: [...winnersOf(longest)],
    beaten: [...losersOf(longest)],
  });

  const busiest = sessions.reduce((best, s) =>
    s.matches.length > best.matches.length ? s : best,
  );
  records.push({
    kind: "busiest-night",
    label: "Flestir leikir á einu kvöldi",
    value: `${busiest.matches.length}`,
    detail: formatIcelandicDate(busiest.playedOn),
    sessionId: busiest.id,
    matchId: null,
    players: [],
  });

  let streakHolder: { player: PlayerId; run: number; sessionId: number } | null =
    null;
  for (const session of sessions) {
    for (const [player, run] of personalStreaksInSession(session.matches).best) {
      if (!streakHolder || run > streakHolder.run) {
        streakHolder = { player, run, sessionId: session.id };
      }
    }
  }
  if (streakHolder) {
    records.push({
      kind: "longest-personal-streak",
      label: "Lengsta sigurhrina",
      value: `${streakHolder.run}`,
      detail: formatIcelandicDate(
        sessions.find((s) => s.id === streakHolder!.sessionId)?.playedOn ?? "",
      ),
      sessionId: streakHolder.sessionId,
      matchId: null,
      players: [streakHolder.player],
    });
  }

  return records;
}

const ICELANDIC_MONTHS = [
  "janúar",
  "febrúar",
  "mars",
  "apríl",
  "maí",
  "júní",
  "júlí",
  "ágúst",
  "september",
  "október",
  "nóvember",
  "desember",
];

const ICELANDIC_WEEKDAYS = [
  "sunnudagur",
  "mánudagur",
  "þriðjudagur",
  "miðvikudagur",
  "fimmtudagur",
  "föstudagur",
  "laugardagur",
];

export function formatIcelandicDate(iso: string): string {
  if (!iso) return "";
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getDate()}. ${ICELANDIC_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatIcelandicWeekday(iso: string): string {
  if (!iso) return "";
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return ICELANDIC_WEEKDAYS[date.getDay()];
}

export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/**
 * Green reads as "good", so it is reserved for a winning record. Below even,
 * the number stays neutral rather than quietly congratulating a losing season.
 */
export function winRateTone(rate: number, played: number): string {
  if (played === 0) return "text-ink-faint";
  if (rate >= 0.5) return "text-win";
  return "text-ink-muted";
}

/** Matches this player appeared in, newest first. */
export function recentMatchesFor(
  sessions: Session[],
  playerId: PlayerId,
  limit = 10,
): { match: Match; playedOn: string }[] {
  const rows: { match: Match; playedOn: string }[] = [];
  for (const session of [...sessions].reverse()) {
    for (const match of [...session.matches].reverse()) {
      if (didPlay(match, playerId)) {
        rows.push({ match, playedOn: session.playedOn });
      }
      if (rows.length >= limit) return rows;
    }
  }
  return rows;
}
