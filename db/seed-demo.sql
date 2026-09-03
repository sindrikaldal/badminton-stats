-- Throwaway data for local development. Wipe with db/reset.sql.
-- The names are placeholders; the shape mirrors a real evening, including a
-- nine-win personal run that produces three honors.

TRUNCATE matches, session_attendees, sessions, seasons, players RESTART IDENTITY CASCADE;

INSERT INTO players (name, short_name, initials) VALUES
  ('Leikmaður A', 'Leikm. A', 'LA'),
  ('Leikmaður B', 'Leikm. B', 'LB'),
  ('Leikmaður C', 'Leikm. C', 'LC'),
  ('Leikmaður D', 'Leikm. D', 'LD'),
  ('Leikmaður E', 'Leikm. E', 'LE'),
  ('Leikmaður F', 'Leikm. F', 'LF'),
  ('Leikmaður G', 'Leikm. G', 'LG');

INSERT INTO seasons (name, started_on) VALUES ('Veturinn 2026–27', '2026-09-01');

-- The older evening is finished; the newer one is left in progress so the
-- Kvöldið tab opens straight onto a live score pad.
INSERT INTO sessions (season_id, played_on, ended_at) VALUES
  (1, '2026-08-27', '2026-08-27 21:30+00'),
  (1, '2026-09-02', NULL);

INSERT INTO session_attendees (session_id, player_id)
SELECT s.id, p.id FROM sessions s CROSS JOIN players p;

-- An ordinary evening.
INSERT INTO matches (session_id, seq, a1, a2, b1, b2, score_a, score_b) VALUES
  (1, 1, 2, 3, 4, 5, 11, 8),
  (1, 2, 2, 3, 6, 7, 9, 11),
  (1, 3, 6, 7, 1, 4, 11, 6),
  (1, 4, 6, 7, 2, 5, 13, 11),
  (1, 5, 1, 4, 6, 7, 11, 9);

-- Player 1 wins nine straight across three different partners.
INSERT INTO matches (session_id, seq, a1, a2, b1, b2, score_a, score_b) VALUES
  (2, 1, 1, 2, 3, 4, 11, 6),
  (2, 2, 1, 2, 5, 6, 11, 8),
  (2, 3, 1, 2, 3, 7, 11, 7),   -- honor 1
  (2, 4, 1, 3, 2, 4, 11, 9),
  (2, 5, 1, 3, 5, 6, 12, 10),
  (2, 6, 1, 3, 2, 7, 11, 4),   -- honor 2
  (2, 7, 1, 5, 3, 4, 11, 8),
  (2, 8, 1, 5, 2, 6, 15, 13),
  (2, 9, 1, 5, 3, 7, 11, 5);   -- honor 3
