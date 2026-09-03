-- Adds the notion of an evening being over.
--
-- Run this once against a database created before the column existed. Fresh
-- installs get it from db/schema.sql and should skip this file.

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ended_at timestamptz;

-- Existing rows predate the column, so they all look "in progress". Close
-- every one except the most recent, which is the only plausible candidate for
-- an evening still underway.
UPDATE sessions SET ended_at = created_at
WHERE ended_at IS NULL
  AND id <> (SELECT id FROM sessions ORDER BY played_on DESC, id DESC LIMIT 1);

CREATE UNIQUE INDEX IF NOT EXISTS sessions_one_open
  ON sessions ((ended_at IS NULL)) WHERE ended_at IS NULL;
