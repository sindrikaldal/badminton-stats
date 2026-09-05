# Badd Boys — Spec

An Icelandic-language, installable PWA for a weekly 2v2 badminton group. Used
courtside to log match results and browse statistics across a winter season.

## Access model

- **One single group.** No multi-tenancy.
- **No user accounts.** A shared group code (server-side env var `GROUP_CODE`)
  grants access; it is stored in an httpOnly cookie once entered.
- **"Who am I" picker.** After entering the code you pick which player you are.
  Stored in `localStorage` for personalization only — it is not authentication
  and protects nothing. Anyone may change it.
- Everyone can log and edit everything. This is a trusted group of friends.

## Domain model

```
Season  →  Session  →  Match
```

- **Season** — e.g. "Veturinn 2026–27". Exactly one is active at a time. Created
  manually (name + start date), roughly once a year in autumn; creating a new one
  closes the previous. Past seasons stay browsable, alongside an all-time view.
- **Session** — one evening. Starts by picking tonight's attendees from the
  roster (guests can be added inline). Attendance is explicit, not derived from
  matches, so "showed up but played nothing" is representable.
- **Match** — one game, two pairs, a final score.

## Rules of play

- A game is played **to 11, win by 2, no cap.** 15–13 is legal and should be
  celebrated as a marathon.
- **7–0 ends the game on the spot.** It is the only legal final score short of
  eleven, and the only one with a loser on nil. Real points count in every
  tally (7 for, 0 against), but a 7–0 outranks any margin for "biggest win",
  the losers get a full-screen shaming, and each player carries a count of
  7–0s given and taken. Guests are counted but never named by the
  "Flest 7–0" record.
- **Final score entry only.** No rally-by-rally scoring, no match timer, no
  serve tracking. You play the game as normal, then tap in `11–7` afterwards.
- **Winners keep the court.** Next-match setup pre-fills the winning pair.
- **The app never decides who plays next.** Rotation is human-decided and varies
  with headcount (5 players use rock-paper-scissors; 6 split into three teams).
  The app only makes assigning the four slots fast.

## Streaks and honors

Both are **derived from the match log**, never stored as awards. Editing or
deleting a match recomputes everything.

- **Pair streak** — the same pair winning 3 consecutive matches earns the
  **"Þrír í röð"** honor. Full-screen celebration. Credited to the pair and to
  both players individually.
- Uncapped: six straight wins by the same pair is **two** honors.
- **Personal streak** — a player's consecutive wins regardless of partner, also
  uncapped. Nine straight wins across re-formed teams is a personal streak of 9.
- Streaks are **within a single session only**; they do not carry across weeks.
- **After a split:** the app warns if you try to re-pair those two in the very
  next match, but never blocks it.

## Statistics

Available per-season and all-time.

- **Leaderboard** — ranked by win %, with a minimum-matches threshold (25% of
  season matches) to qualify. Total wins shown alongside.
- **Per player** — W/L, win %, current and best streak, honors count,
  attendance, average point differential.
- **Pair chemistry** — best duo records when playing together.
- **Head-to-head** — record against each other player, whenever on opposing
  sides.
- **Records** — biggest thrashing (a 7–0 always wins it), longest game, most
  matches in a night, most 7–0s suffered.

## Stack

- **Next.js** (App Router, TypeScript) on **Vercel**.
- **Postgres** via the Vercel Marketplace.
- **Online-first** with optimistic UI and a retry queue for flaky moments. No
  offline-first sync or conflict resolution.
- Live-ish updates via polling — a match is logged roughly every ten minutes.

## Design

Based on the Stitch "Pro Arena Dynamic" design, toned down.

**Keep:** dark navy base, Barlow Condensed for scores and headings, Rubik for
body, green-for-winner / cyan-for-challenger color logic, neon glows and auras
on cards, large touch targets, bottom nav (Kvöldið · Leikir · Tölfræði ·
Leikmenn).

**Dropped:** gradient-filled buttons, skewed/sheared chips, volt-yellow as a
competing third accent, italics on every heading (scores and streak badges
only), fake carbon-fiber texture, angular chamfers (gentle 8px radii instead),
stock photos of pro players (initial-based avatars instead).

Source design lives in `~/Downloads/stitch_badd_boys_badminton_tracker/`.

## Scope

**v1:** group code + "who am I"; roster with guests; start session with
attendees; log match with final score; next-match setup with pre-fill and split
warning; auto-detected streaks, honors and celebration; edit/delete any match;
season + all-time stats; installable PWA; backfill of the 2026-09-02 session.

**Deferred:** push notifications, player photo uploads, shareable end-of-night
summary card, season trend charts, ELO/skill rating, multi-court support.
