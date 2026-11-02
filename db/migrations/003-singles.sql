-- Adds 1v1 games: one player a side, a2 and b2 left NULL.
--
-- Run this once against a database created before 1v1 existed. Fresh
-- installs get it from db/schema.sql and should skip this file.
--
-- Touches no rows. Every existing match is 2v2 and passes the new checks.

ALTER TABLE matches ALTER COLUMN a2 DROP NOT NULL;
ALTER TABLE matches ALTER COLUMN b2 DROP NOT NULL;

ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_four_distinct_players;

-- 2v2 or 1v1, never two against one.
ALTER TABLE matches ADD CONSTRAINT matches_sides_even
  CHECK ((a2 IS NULL) = (b2 IS NULL));

ALTER TABLE matches ADD CONSTRAINT matches_distinct_players CHECK (
  CASE WHEN a2 IS NULL THEN a1 <> b1
  ELSE a1 <> a2 AND b1 <> b2 AND a1 <> b1 AND a1 <> b2 AND a2 <> b1 AND a2 <> b2
  END
);
