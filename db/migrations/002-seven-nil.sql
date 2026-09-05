-- Adds the mercy rule: 7-0 ends a game on the spot.
--
-- Run this once against a database created before the rule existed. Fresh
-- installs get it from db/schema.sql and should skip this file.
--
-- No match has ever been logged 7-0, so this touches no rows. It swaps the
-- score constraint for one that accepts exactly 7-0 alongside the usual
-- to-eleven-win-by-two -- and, since a game on 7-0 is over, rejects any
-- other final score with a loser on nil.

ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_to_eleven_win_by_two;

ALTER TABLE matches ADD CONSTRAINT matches_legal_final_score CHECK (
  (GREATEST(score_a, score_b) = 7 AND LEAST(score_a, score_b) = 0)
  OR (
    GREATEST(score_a, score_b) >= 11
    AND LEAST(score_a, score_b) >= 1
    AND GREATEST(score_a, score_b) - LEAST(score_a, score_b) >= 2
  )
);
