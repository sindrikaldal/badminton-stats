# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One private group of friends who play 2v2 badminton every week in Iceland, five to eight players a night plus the odd guest. The main scene is the hall: a phone on the bench under bright sports-hall lighting, picked up between games by whoever is free, often sweaty and holding a racket, to tap in a final score. Stats get browsed afterwards too, but logging courtside is the primary use.

## Product Purpose

Log every game of the evening in seconds, then settle arguments with a season's worth of statistics: leaderboard, streaks, pair chemistry, head-to-head, records. Success is that every game gets logged courtside without slowing the evening down, and the stats become part of the banter.

## Positioning

Built for this one group's house rules rather than for badminton in general: games to 11, win by 2, no cap; 7–0 ends a game on the spot and earns the losers a public shaming; winners keep the court; a pair winning three straight earns the "Þrír í röð" honor and must split. Every stat is derived from the match log, so correcting a game fixes the whole season.

## Operating Context

- Installable PWA, portrait, opened from the home screen.
- Several phones may be open on the same evening; they stay in step by polling.
- Access is a shared group code plus a "who am I" picker; everyone may log and edit everything.
- Interface language is Icelandic.

## Capabilities and Constraints

- Tabs: Kvöldið (tonight / score pad), Leikir (matches), Tölfræði (stats), Leikmenn (players).
- Final score entry only; no rally scoring, timers or serve tracking.
- The app never decides who plays next; it only makes filling four slots fast.
- Full-screen moments exist for a 7–0 and for a "Þrír í röð" honor.
- Initials-based avatars; no player photos.
- Stack: Next.js App Router, Tailwind v4, Postgres.

## Brand Commitments

- The name **Badd Boys** stays. Its lettering, colours and icon are free to change.
- The previous dark navy and neon-glow look is explicitly rejected.
- Yonex gear is one acceptable reference among several, not a brief. No Yonex logos or wordmark.

## Evidence on Hand

- `db/seed-demo.sql`: placeholder players and two evenings, used for local development.
- No photography, logos or other brand assets beyond the current shuttle icon in `src/app/icon.svg`, which may be replaced.

## Product Principles

- Courtside first: a sweaty glance under hall lights must be enough to read the score pad and hit the right button.
- The house rules are the product; make them visible, not generic sports UI.
- Banter is a feature: shaming, honors and records should land with personality.
- Derived, never stored: any correction ripples through every number.

## Accessibility & Inclusion

High contrast and large touch targets under bright, glaring indoor light are required, not optional.
