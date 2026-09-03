-- Badd Boys schema.
--
-- Deliberately small. Wins, streaks, honors and every statistic are DERIVED
-- from the match log at read time, never stored -- so editing a match in week 3
-- silently corrects the season table without any backfill step.

CREATE TABLE IF NOT EXISTS players (
  id          serial PRIMARY KEY,
  name        text NOT NULL,
  -- Shown on cramped surfaces (score pads, head-to-head rows): "Kári S."
  short_name  text NOT NULL,
  -- Initials avatar; two chars, e.g. "KS".
  initials    text NOT NULL,
  is_guest    boolean NOT NULL DEFAULT false,
  -- Guests and retired regulars stay in history but leave the roster picker.
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seasons (
  id          serial PRIMARY KEY,
  name        text NOT NULL,
  started_on  date NOT NULL,
  ended_on    date,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Exactly one season may be open at a time. Creating a new one closes the old.
CREATE UNIQUE INDEX IF NOT EXISTS seasons_one_active
  ON seasons ((ended_on IS NULL)) WHERE ended_on IS NULL;

CREATE TABLE IF NOT EXISTS sessions (
  id          serial PRIMARY KEY,
  season_id   integer NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  played_on   date NOT NULL,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_season_idx ON sessions (season_id, played_on DESC);

-- Attendance is recorded explicitly rather than inferred from matches, so
-- "turned up, played nothing" is representable.
CREATE TABLE IF NOT EXISTS session_attendees (
  session_id  integer NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id   integer NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, player_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id          serial PRIMARY KEY,
  session_id  integer NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  -- Order within the evening. Streaks are read off this, so it must be stable.
  seq         integer NOT NULL,
  a1          integer NOT NULL REFERENCES players(id),
  a2          integer NOT NULL REFERENCES players(id),
  b1          integer NOT NULL REFERENCES players(id),
  b2          integer NOT NULL REFERENCES players(id),
  score_a     integer NOT NULL,
  score_b     integer NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT matches_no_draw CHECK (score_a <> score_b),
  CONSTRAINT matches_scores_sane CHECK (score_a >= 0 AND score_b >= 0),
  -- A game runs to 11, win by 2, no cap: the winner has >= 11 and a margin
  -- of >= 2. 15-13 passes; 11-10 and 9-2 do not.
  CONSTRAINT matches_to_eleven_win_by_two CHECK (
    GREATEST(score_a, score_b) >= 11
    AND GREATEST(score_a, score_b) - LEAST(score_a, score_b) >= 2
  ),
  CONSTRAINT matches_four_distinct_players CHECK (
    a1 <> a2 AND b1 <> b2 AND a1 <> b1 AND a1 <> b2 AND a2 <> b1 AND a2 <> b2
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS matches_session_seq ON matches (session_id, seq);
