import { sql } from "./db";
import type { Match, Player, PlayerId, Season, Session } from "./domain/types";

type MatchRow = {
  id: number;
  sessionId: number;
  seq: number;
  a1: number;
  a2: number;
  b1: number;
  b2: number;
  scoreA: number;
  scoreB: number;
};

type SessionRow = {
  id: number;
  seasonId: number;
  playedOn: Date;
  note: string | null;
  endedAt: Date | null;
};

function toMatch(row: MatchRow): Match {
  return {
    id: row.id,
    sessionId: row.sessionId,
    seq: row.seq,
    teamA: [row.a1, row.a2],
    teamB: [row.b1, row.b2],
    scoreA: row.scoreA,
    scoreB: row.scoreB,
  };
}

export async function getPlayers(): Promise<Player[]> {
  return sql<Player[]>`
    SELECT id, name, short_name, initials, is_guest, is_active
    FROM players
    ORDER BY is_guest, name
  `;
}

export async function createPlayer(input: {
  name: string;
  shortName?: string;
  isGuest?: boolean;
}): Promise<Player> {
  const name = input.name.trim();
  const shortName = input.shortName?.trim() || defaultShortName(name);
  const [player] = await sql<Player[]>`
    INSERT INTO players (name, short_name, initials, is_guest)
    VALUES (${name}, ${shortName}, ${initialsOf(name)}, ${input.isGuest ?? false})
    RETURNING id, name, short_name, initials, is_guest, is_active
  `;
  return player;
}

/** "Kári Sigurðsson" -> "Kári S." */
function defaultShortName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return name;
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * How much history a player is tangled up in. Anyone who has played a match
 * cannot be removed without destroying that match, so the UI offers archiving
 * instead -- and this is what it branches on.
 */
export async function getPlayerUsage(
  playerId: PlayerId,
): Promise<{ matches: number; sessions: number }> {
  const [row] = await sql<{ matches: number; sessions: number }[]>`
    SELECT
      (SELECT count(*) FROM matches
        WHERE a1 = ${playerId} OR a2 = ${playerId}
           OR b1 = ${playerId} OR b2 = ${playerId})::int AS matches,
      (SELECT count(*) FROM session_attendees
        WHERE player_id = ${playerId})::int AS sessions
  `;
  return row;
}

/**
 * Only ever called for a player with no matches. Their attendance rows cascade;
 * the foreign keys on `matches` deliberately do not, so a player with history
 * makes this fail rather than quietly shredding results.
 */
export async function deletePlayer(playerId: PlayerId): Promise<void> {
  await sql`DELETE FROM players WHERE id = ${playerId}`;
}

/** Archiving keeps every past result while dropping them from the pickers. */
export async function setPlayerActive(
  playerId: PlayerId,
  isActive: boolean,
): Promise<void> {
  await sql`UPDATE players SET is_active = ${isActive} WHERE id = ${playerId}`;
}

export async function getActiveSeason(): Promise<Season | null> {
  const [season] = await sql<Season[]>`
    SELECT id, name, started_on, ended_on
    FROM seasons
    WHERE ended_on IS NULL
    ORDER BY started_on DESC
    LIMIT 1
  `;
  return season ?? null;
}

export async function getSeasons(): Promise<Season[]> {
  return sql<Season[]>`
    SELECT id, name, started_on, ended_on
    FROM seasons
    ORDER BY started_on DESC
  `;
}

export async function getSeason(id: number): Promise<Season | null> {
  const [season] = await sql<Season[]>`
    SELECT id, name, started_on, ended_on FROM seasons WHERE id = ${id}
  `;
  return season ?? null;
}

/** Opens a season, closing whichever one was open. Done once each autumn. */
export async function createSeason(input: {
  name: string;
  startedOn: string;
}): Promise<Season> {
  return sql.begin(async (tx) => {
    await tx`
      UPDATE seasons SET ended_on = ${input.startedOn}::date - 1
      WHERE ended_on IS NULL
    `;
    const [season] = await tx<Season[]>`
      INSERT INTO seasons (name, started_on)
      VALUES (${input.name}, ${input.startedOn})
      RETURNING id, name, started_on, ended_on
    `;
    return season;
  });
}

/**
 * Every session in a season, oldest first, with attendees and matches loaded.
 * The stats engine wants the whole season in memory -- which is fine at a few
 * hundred matches a year, and keeps all derivation in one testable place.
 */
export async function getSessions(seasonId: number): Promise<Session[]> {
  const sessionRows = await sql<SessionRow[]>`
    SELECT id, season_id, played_on, note, ended_at
    FROM sessions
    WHERE season_id = ${seasonId}
    ORDER BY played_on, id
  `;

  if (sessionRows.length === 0) return [];

  const ids = sessionRows.map((s) => s.id);

  const attendeeRows = await sql<{ sessionId: number; playerId: number }[]>`
    SELECT session_id, player_id FROM session_attendees
    WHERE session_id IN ${sql(ids)}
  `;

  const matchRows = await sql<MatchRow[]>`
    SELECT id, session_id, seq, a1, a2, b1, b2, score_a, score_b
    FROM matches
    WHERE session_id IN ${sql(ids)}
    ORDER BY session_id, seq
  `;

  return sessionRows.map((row) => ({
    id: row.id,
    seasonId: row.seasonId,
    playedOn: toIsoDate(row.playedOn),
    note: row.note,
    endedAt: row.endedAt ? row.endedAt.toISOString() : null,
    attendees: attendeeRows
      .filter((a) => a.sessionId === row.id)
      .map((a) => a.playerId),
    matches: matchRows.filter((m) => m.sessionId === row.id).map(toMatch),
  }));
}

export async function getSession(id: number): Promise<Session | null> {
  const [row] = await sql<SessionRow[]>`
    SELECT id, season_id, played_on, note, ended_at
    FROM sessions WHERE id = ${id}
  `;
  if (!row) return null;

  const attendees = await sql<{ playerId: number }[]>`
    SELECT player_id FROM session_attendees WHERE session_id = ${id}
  `;
  const matchRows = await sql<MatchRow[]>`
    SELECT id, session_id, seq, a1, a2, b1, b2, score_a, score_b
    FROM matches WHERE session_id = ${id} ORDER BY seq
  `;

  return {
    id: row.id,
    seasonId: row.seasonId,
    playedOn: toIsoDate(row.playedOn),
    note: row.note,
    endedAt: row.endedAt ? row.endedAt.toISOString() : null,
    attendees: attendees.map((a) => a.playerId),
    matches: matchRows.map(toMatch),
  };
}

/** The evening in progress, if there is one. At most one can be open. */
export async function getOpenSession(): Promise<Session | null> {
  const [row] = await sql<{ id: number }[]>`
    SELECT id FROM sessions WHERE ended_at IS NULL LIMIT 1
  `;
  return row ? getSession(row.id) : null;
}

export type SessionSummary = {
  id: number;
  seasonId: number;
  seasonName: string;
  playedOn: string;
  endedAt: string | null;
  matchCount: number;
  attendeeCount: number;
};

/**
 * Counted in SQL rather than by loading every match: the history list only
 * needs totals, and it spans all seasons.
 */
export async function getSessionSummaries(
  limit = 40,
): Promise<SessionSummary[]> {
  const rows = await sql<
    {
      id: number;
      seasonId: number;
      seasonName: string;
      playedOn: Date;
      endedAt: Date | null;
      matchCount: number;
      attendeeCount: number;
    }[]
  >`
    SELECT
      s.id,
      s.season_id,
      se.name AS season_name,
      s.played_on,
      s.ended_at,
      (SELECT count(*) FROM matches m WHERE m.session_id = s.id)::int AS match_count,
      (SELECT count(*) FROM session_attendees a WHERE a.session_id = s.id)::int AS attendee_count
    FROM sessions s
    JOIN seasons se ON se.id = s.season_id
    ORDER BY s.played_on DESC, s.id DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    seasonId: row.seasonId,
    seasonName: row.seasonName,
    playedOn: toIsoDate(row.playedOn),
    endedAt: row.endedAt ? row.endedAt.toISOString() : null,
    matchCount: row.matchCount,
    attendeeCount: row.attendeeCount,
  }));
}

export async function endSession(id: number): Promise<void> {
  await sql`UPDATE sessions SET ended_at = now() WHERE id = ${id}`;
}

/**
 * Reopens a finished evening. The unique index means this fails while another
 * night is still in progress, which the caller turns into a readable message.
 */
export async function reopenSession(id: number): Promise<void> {
  await sql`UPDATE sessions SET ended_at = NULL WHERE id = ${id}`;
}

export async function createSession(input: {
  seasonId: number;
  playedOn: string;
  attendees: PlayerId[];
  note?: string | null;
}): Promise<Session> {
  return sql.begin(async (tx) => {
    const [session] = await tx<{ id: number }[]>`
      INSERT INTO sessions (season_id, played_on, note)
      VALUES (${input.seasonId}, ${input.playedOn}, ${input.note ?? null})
      RETURNING id
    `;
    if (input.attendees.length > 0) {
      await tx`
        INSERT INTO session_attendees ${tx(
          input.attendees.map((playerId) => ({
            sessionId: session.id,
            playerId,
          })),
        )}
      `;
    }
    return {
      id: session.id,
      seasonId: input.seasonId,
      playedOn: input.playedOn,
      note: input.note ?? null,
      endedAt: null,
      attendees: input.attendees,
      matches: [],
    };
  });
}

export async function setAttendees(
  sessionId: number,
  attendees: PlayerId[],
): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`DELETE FROM session_attendees WHERE session_id = ${sessionId}`;
    if (attendees.length > 0) {
      await tx`
        INSERT INTO session_attendees ${tx(
          attendees.map((playerId) => ({ sessionId, playerId })),
        )}
      `;
    }
  });
}

export async function addMatch(input: {
  sessionId: number;
  teamA: [PlayerId, PlayerId];
  teamB: [PlayerId, PlayerId];
  scoreA: number;
  scoreB: number;
}): Promise<Match> {
  const [row] = await sql<MatchRow[]>`
    INSERT INTO matches (session_id, seq, a1, a2, b1, b2, score_a, score_b)
    VALUES (
      ${input.sessionId},
      (SELECT COALESCE(MAX(seq), 0) + 1 FROM matches WHERE session_id = ${input.sessionId}),
      ${input.teamA[0]}, ${input.teamA[1]}, ${input.teamB[0]}, ${input.teamB[1]},
      ${input.scoreA}, ${input.scoreB}
    )
    RETURNING id, session_id, seq, a1, a2, b1, b2, score_a, score_b
  `;
  return toMatch(row);
}

export async function getMatch(id: number): Promise<Match | null> {
  const [row] = await sql<MatchRow[]>`
    SELECT id, session_id, seq, a1, a2, b1, b2, score_a, score_b
    FROM matches WHERE id = ${id}
  `;
  return row ? toMatch(row) : null;
}

export async function updateMatch(
  id: number,
  input: {
    teamA: [PlayerId, PlayerId];
    teamB: [PlayerId, PlayerId];
    scoreA: number;
    scoreB: number;
  },
): Promise<Match> {
  const [row] = await sql<MatchRow[]>`
    UPDATE matches SET
      a1 = ${input.teamA[0]}, a2 = ${input.teamA[1]},
      b1 = ${input.teamB[0]}, b2 = ${input.teamB[1]},
      score_a = ${input.scoreA}, score_b = ${input.scoreB}
    WHERE id = ${id}
    RETURNING id, session_id, seq, a1, a2, b1, b2, score_a, score_b
  `;
  return toMatch(row);
}

/** Removes a match and closes the gap in `seq` so streaks stay contiguous. */
export async function deleteMatch(id: number): Promise<void> {
  await sql.begin(async (tx) => {
    const [row] = await tx<{ sessionId: number; seq: number }[]>`
      DELETE FROM matches WHERE id = ${id} RETURNING session_id, seq
    `;
    if (!row) return;
    await tx`
      UPDATE matches SET seq = seq - 1
      WHERE session_id = ${row.sessionId} AND seq > ${row.seq}
    `;
  });
}

export async function deleteSession(id: number): Promise<void> {
  await sql`DELETE FROM sessions WHERE id = ${id}`;
}

function toIsoDate(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}
