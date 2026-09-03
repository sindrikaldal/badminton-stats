import { type HalfRecord, nightStats } from "./night";
import { pairStreaksInSession, personalStreaksInSession } from "./streaks";
import {
  type Match,
  type PairKey,
  type PlayerId,
  type Session,
  MIN_PAIR_MATCHES,
  didPlay,
  didWin,
  losersOf,
  losingScore,
  marginOf,
  opponentsOf,
  pairKey,
  partnerOf,
  reachedDeuce,
  scoreFor,
  winnersOf,
  winningScore,
} from "./types";

/** A player must have played this share of the season's matches to be ranked. */
export const QUALIFY_SHARE = 0.25;

export { MIN_PAIR_MATCHES };

/** Meetings needed before an opponent can be called an erkifjandi. */
export const MIN_NEMESIS_MEETINGS = 8;
/** Games gone to deuce before the record in them means anything. */
export const MIN_DEUCE_GAMES = 5;
/** Evenings long enough to count before a season-long fade is worth naming. */
export const MIN_FADE_SESSIONS = 4;

/** Record in games that went past eleven. */
export type DeuceRecord = { played: number; wins: number };

export type SeasonFade = {
  first: HalfRecord;
  second: HalfRecord;
  /** Second-half win rate minus first-half. Negative means they fade. */
  delta: number;
  /** Evenings long enough to have two halves. */
  sessions: number;
};

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
  /** Longest run of consecutive evenings attended. */
  attendanceStreak: number;
  qualified: boolean;
  deuce: DeuceRecord;
  /** Null until MIN_FADE_SESSIONS evenings are long enough to count. */
  fade: SeasonFade | null;
  /** Evenings long enough to count, whether or not that is yet enough. */
  fadeSessions: number;
  /**
   * Evenings won outright or shared. Computed for everyone; guests are filtered
   * out where it is shown, since a season board is no place for someone who
   * came once.
   */
  nightsWon: number;
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
 * concern.
 *
 * Ordered here rather than demanded of the caller: the all-time view builds
 * its list one season at a time, and seasons come back newest first, so the
 * evenings arrive shuffled. Anything reading "the latest evening" -- current
 * streaks, attendance runs -- silently means the wrong one otherwise.
 */
export function seasonStats(
  unordered: Session[],
  roster: PlayerId[],
): SeasonStats {
  const sessions = [...unordered].sort(
    (a, b) => a.playedOn.localeCompare(b.playedOn) || a.id - b.id,
  );
  const matches = allMatches(sessions);
  const totalMatches = matches.length;
  const totalSessions = sessions.length;
  const qualifyThreshold = Math.ceil(totalMatches * QUALIFY_SHARE);

  const honorsByPlayer = new Map<PlayerId, number>();
  const honorsByPair = new Map<PairKey, number>();
  const bestStreak = new Map<PlayerId, number>();
  const currentStreak = new Map<PlayerId, number>();
  const nightsWon = new Map<PlayerId, number>();
  const fades = new Map<PlayerId, FadeTally>();

  for (const session of sessions) {
    // One pass per evening serves both the nights-won count and the halves
    // the season-long fade is built from.
    const night = nightStats(session);
    for (const player of night.playerOfTheNight) {
      nightsWon.set(player, (nightsWon.get(player) ?? 0) + 1);
    }
    for (const line of night.lines) {
      if (line.half) addHalves(fades, line.playerId, line.half);
    }

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
  const longestRun = new Map<PlayerId, number>();
  const run = new Map<PlayerId, number>();
  for (const session of sessions) {
    const here = new Set(session.attendees);
    // Only an evening the group played and you missed ends a run -- which is
    // why a summer, containing no evenings at all, cannot.
    for (const player of roster) {
      const next = here.has(player) ? (run.get(player) ?? 0) + 1 : 0;
      run.set(player, next);
      if (next > (longestRun.get(player) ?? 0)) longestRun.set(player, next);
    }
    for (const player of session.attendees) {
      attendance.set(player, (attendance.get(player) ?? 0) + 1);
    }
  }

  const players: PlayerStats[] = roster.map((playerId) => {
    let played = 0;
    let wins = 0;
    let pointsFor = 0;
    let pointsAgainst = 0;
    const deuce: DeuceRecord = { played: 0, wins: 0 };

    for (const match of matches) {
      const score = scoreFor(match, playerId);
      if (!score) continue;
      const won = didWin(match, playerId);
      played += 1;
      if (won) wins += 1;
      pointsFor += score[0];
      pointsAgainst += score[1];
      if (reachedDeuce(match)) {
        deuce.played += 1;
        if (won) deuce.wins += 1;
      }
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
      attendanceStreak: longestRun.get(playerId) ?? 0,
      qualified: played >= qualifyThreshold && played > 0,
      deuce,
      fade: fadeFrom(fades.get(playerId)),
      fadeSessions: fades.get(playerId)?.sessions ?? 0,
      nightsWon: nightsWon.get(playerId) ?? 0,
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

type FadeTally = {
  first: HalfRecord;
  second: HalfRecord;
  sessions: number;
};

function addHalves(
  fades: Map<PlayerId, FadeTally>,
  playerId: PlayerId,
  half: { first: HalfRecord; second: HalfRecord },
): void {
  const tally = fades.get(playerId) ?? {
    first: { wins: 0, losses: 0 },
    second: { wins: 0, losses: 0 },
    sessions: 0,
  };
  tally.first.wins += half.first.wins;
  tally.first.losses += half.first.losses;
  tally.second.wins += half.second.wins;
  tally.second.losses += half.second.losses;
  tally.sessions += 1;
  fades.set(playerId, tally);
}

/**
 * Each evening's halves added together, rather than the season cut down the
 * middle -- otherwise this measures November against February instead of
 * fresh against tired.
 */
function fadeFrom(tally: FadeTally | undefined): SeasonFade | null {
  if (!tally || tally.sessions < MIN_FADE_SESSIONS) return null;

  const firstPlayed = tally.first.wins + tally.first.losses;
  const secondPlayed = tally.second.wins + tally.second.losses;
  if (firstPlayed === 0 || secondPlayed === 0) return null;

  return {
    first: tally.first,
    second: tally.second,
    delta: tally.second.wins / secondPlayed - tally.first.wins / firstPlayed,
    sessions: tally.sessions,
  };
}

/**
 * The opponent with the best record against this player -- the mirror of
 * "besti meðspilari". Only regulars are eligible: being told your nemesis is
 * a man you have met once is worse than being told nothing.
 */
export function nemesisFor(
  matches: Match[],
  playerId: PlayerId,
  eligible: ReadonlySet<PlayerId>,
): HeadToHead | null {
  return (
    headToHead(matches, playerId)
      .filter(
        (h) => h.played >= MIN_NEMESIS_MEETINGS && eligible.has(h.opponent),
      )
      .sort((a, b) => a.winRate - b.winRate || b.played - a.played)[0] ?? null
  );
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
