# Fun stats — plan

More statistics, in three places: live during the evening, as a summary when
the night closes, and as season-long narrative. Everything below is **derived
from the match log** like the rest of the app — nothing new is stored, so
correcting a match in week three silently fixes every number here.

## Principles

- **Roastable events, gentle aggregates.** A stat may point at something that
  happened ("þú fékkst 2–11"), never deliver a verdict on a person's worth.
  This is why there is no *carry stat* (your partners' win rate with you vs.
  without you): it is the funniest number available and the only one that ends
  friendships.
- **Order, not time.** `matches.seq` is exact, free, and survives the backfilled
  2026-09-02 session. `created_at` is the moment a score was *typed*, which for
  the backfill is nonsense and live is wrong whenever someone logs two games at
  once. No match timer — SPEC.md already said no, and a record that is
  occasionally a lie is worse than no record.
- **Guests win nightly awards, never season ones.** A guest sweeping the evening
  is an event, and the funniest thing that can happen. A guest sitting on the
  season board having attended once is a bug. Their matches still count for
  everyone else — beating a guest is a win. They are excluded as *candidates*,
  not as opponents.
  - A guest who becomes a regular: flip `is_guest` on the **existing** row and
    their whole history backfills itself. Do not create a second player.
- **A stat with too little data does not appear.** No asterisks — the number is
  what people quote in the car park. Instead, show what it is waiting for:
  *"Erkifjandi: þarf 3 viðureignir í viðbót"*. Four of the five season stats
  will be empty until roughly December; the nightly card carries the feature
  until then.

## Surface 1 — Staðan í kvöld (live)

A table on the open session view, **below the log form**, above the match list.
The Kvöldið tab is a tool first: you are sweaty, holding a racket, and the job
is tapping in `11–7` in four seconds. Nothing goes above the form.

- Every attendee, including those who have played nothing — attendance is
  explicit in this app, so "mætti, spilaði ekkert" is a real row.
- Each row: `Kári 5–2 · 3 í röð`.
- Sorted with the **existing `rankedLeaderboard` comparator** (win rate → wins →
  avg margin), qualified players first, exactly as the season table does. That
  makes the top row the *current* maður kvöldsins, and keeps someone who is 1–0
  after one game from sitting above someone who is 6–2.

No rotating ticker of one-liners. It needs randomness, renders differently every
poll, cannot be tested, and stops being funny in a fortnight.

## Surface 2 — Kvöldið í tölum (the nightly card)

**It is a place, not a moment.** A permanent section at the top of the closed
session view (`/?kvold=<id>`), above the match list. Tapping *Ljúka kvöldinu*
revalidates and the summary is simply what is on screen — the reveal comes free
from a page transition that already exists.

Deliberately *not* a full-screen takeover like `Celebration`: sessions can be
reopened and re-ended ([EndSession.tsx](src/components/EndSession.tsx)), so a
modal fires twice and needs per-session "seen" state that is wrong on the second
phone. Honors are rare and deserve a takeover; ending the night happens weekly
and would become a weekly tap-to-dismiss.

Contents:

| Tile | Rule |
|---|---|
| **Maður kvöldsins** | Best win rate among attendees who played at least **half the games of the busiest attendee**, rounded up. Ordered by the `rankedLeaderboard` comparator so the award and the season table never disagree about "better". An exact tie after all three keys is **shared** — two names, a badge each. Breaking it on player id is deterministic but indefensible, and the award would lose its authority the first time it happened out loud. |
| **Stærsti skellurinn** | Biggest margin of the night, naming winners and losers. |
| **Jafnasti leikurinn** | Smallest margin, tie broken by **most total points** — so a 15–13 beats an 11–9. Both were tight; one was a war. |
| **Kvöldparið** | Best duo with at least `MIN_PAIR_MATCHES` (3) games together. Win rate, then games. Hidden if no pair qualifies. |
| **Dofnaði / Hitnaði** | Both ends of the same tile — a stat with only a loser reads meaner than one that swings both ways. |
| **Roster lines** | Every attendee: `3S–2T · lengsta hrina 2 · +1.4`. |

The roster lines are the part worth defending. Three or four award tiles get
swept by one or two people; someone who turned up and went 1–4 otherwise gets no
mention and no reason to look. A closing roster where everyone has a row makes
the card about the evening rather than about the winner — and it is where the
light roast lives naturally, since a row reading 0–5 needs no caption.

### Dofnaði / Hitnaði

- Split **each player's own matches**, not the evening. Someone who arrived for
  game 5 still has a first and second half.
- **Equal halves, drop the middle game** when the count is odd — 7 games becomes
  the first 3 against the last 3, so the delta is not an artifact of the split.
- Display **raw records**, `2–0 → 0–3`. At this sample "100% → 0%" is true and
  reads as satire; the shape of the collapse is the joke.
- Suppress the tile entirely unless someone has **≥ 4 matches** that night.
- **Shared on an exact tie**, like maður kvöldsins — two players who partnered
  all night collapse identically, and picking one of them arbitrarily is the
  thing we already refused to do for the award. The tile must render
  "Davíð & Jón" as happily as one name.
- A fade needs a **strictly negative** delta. On a night where everyone
  improved, the least-improved player is not *sá sem dofnaði*; the tile is
  simply empty.
- The split is stored on **every line**, not just the two extremes, so any
  player's halves can be shown wherever it is useful.

## Surface 3 — season stats

No fourth tab. Personal stats join the player page beside *Besti meðspilari*;
group records become more cards in *Met & stuð*.

| Stat | Where | Rule |
|---|---|---|
| **Erkifjandi** | Player page | The opponent you have the worst record against — lowest win rate, tie broken by more meetings. Minimum **8 meetings**; you face each regular 2–3 times an evening, so it lands around evening four. The exact mirror of *Besti meðspilari*, off the existing `headToHead`. |
| **Framlengingar** | Player page | W–L in games where the **losing** score reached 10. Honest "clutch" — 12–10 counts, 11–9 does not. Minimum **5** such games. |
| **Dofnaði (season)** | Player page | Aggregate each evening's halves across the season. Do **not** split the season itself, or you are measuring November against February rather than fresh against tired. Minimum **4** evenings of ≥ 4 matches. |
| **Mætingarkóngur** | Met & stuð | Longest run of consecutive evenings attended. The summer cannot break it — between seasons there are no evenings, so a live streak carries across. The only thing that ends it is an evening the group played and you did not. |
| **`4× maður kvöldsins`** | Player page + leaderboard row | A badge, not a named noun — "Kvöldsigrar" reads as "wins tonight", which is precisely what it is not. Shared awards count for everyone who shared. |

## Code

- **New `src/lib/domain/night.ts`**, exporting one `nightStats(session, players)`
  that returns the whole card as a single typed object. Mirrors `seasonStats` in
  shape, so there is one obvious place to look for either scope.
- **`stats.ts` imports `night.ts`, never the reverse.** The badge is a season
  count of a nightly award, so the season pass calls `nightStats` once per
  session — the same pattern as the existing per-session `pairStreaksInSession`
  call. Free at a few hundred matches.
- **New fields on `PlayerStats`**: framlengingar record, the dofnaði split,
  attendance streak, nights won. Both the leaderboard and the player page
  already read that object; four more numbers per player cost nothing next to
  loading the season into memory.
- New constants beside `QUALIFY_SHARE` / `MIN_PAIR_MATCHES`:
  `MIN_NEMESIS_MEETINGS = 8`, `MIN_DEUCE_GAMES = 5`, `MIN_FADE_SESSIONS = 4`,
  `FADE_MIN_MATCHES = 4`.
- `MIN_PAIR_MATCHES` lives in `types.ts` rather than `stats.ts`, so `night.ts`
  can use it without importing `stats.ts` and inverting the dependency.
  `stats.ts` re-exports it, so nothing that imported it before had to change.
- A night's lines cover **attendees plus anyone named in a match**. If a match
  names someone never ticked off as present, showing them beats losing their
  games.
- No schema change, no migration. `ORDER BY seq` and oldest-first sessions are
  already guaranteed by [repo.ts](src/lib/repo.ts).

## Tests

Beside `streaks.test.ts`, covering the four rules that are not obvious from
reading the code:

1. **Dofnaði splitting** — odd counts drop the middle game, split is per-player
   not per-evening, suppressed under 4 matches.
2. **Maður kvöldsins** — the adaptive bar excludes a 3–0 who barely played, and
   a genuine three-way tie returns all three rather than picking one.
3. **Framlengingar** — 12–10 counts, 11–9 does not.
4. **Mætingarstreak** — survives a season boundary, breaks on an evening the
   group played without you.

The max()-style records (stærsti skellurinn, jafnasti leikurinn) stay untested:
one-line reductions where the test would restate the implementation.

## Build order

1. ~~`night.ts` + its tests~~ — **done**. It powers all three surfaces.
2. Staðan í kvöld, under the log form.
3. Kvöldið í tölum on the closed session view.
4. Season fields on `PlayerStats` + tests.
5. Player page: erkifjandi, framlengingar, dofnaði, badge — **each shipping
   with its countdown teaser**, not as a later pass. Every one of these is
   empty until roughly December, so without the countdown the whole step looks
   like nothing happened, and a step that looks like nothing happened is the
   one that quietly never gets finished.
6. Met & stuð: mætingarkóngur.

## Out of scope

- **Carry stat** (win rate with you vs. without you) — see the tone rule.
- **Draugurinn** (worst partner) — the carry stat wearing a hat.
- **Skellir** (thrashings dealt/received) — overlaps *Stærsti skellurinn*.
- **Season trend charts** — deferred in SPEC.md; a charting dependency for the
  least funny item on the list.
- **Shareable image card** — everyone in the audience already has the group
  code, so a link to `/?kvold=12` *is* the share. Canvas rendering is days of
  work to serve people who can already see the real thing.
- **Match durations, timers, ELO** — unchanged from SPEC.md.
