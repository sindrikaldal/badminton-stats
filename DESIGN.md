---
name: Badd Boys
description: Badminton evenings, games and stats for one club, logged courtside on a phone.
colors:
  canvas: "#eef1ec"
  surface: "#ffffff"
  surface-raised: "#e3e8e2"
  surface-input: "#ffffff"
  line: "#d5dcd4"
  line-bright: "#b9c3b8"
  ink: "#16201a"
  ink-muted: "#46524a"
  ink-faint: "#5e6a62"
  win: "#1a6b43"
  win-dim: "#d9ebe0"
  court: "#1f7a4d"
  court-deep: "#14573a"
  tape: "#ffffff"
  challenge: "#1d4f96"
  challenge-dim: "#dde6f3"
  shuttle: "#f4d23c"
  flame: "#8a5a00"
  danger: "#b42318"
typography:
  score:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "4rem"
    fontWeight: 800
    lineHeight: 0.85
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 62"
    fontFeature: "'tnum'"
  display:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 62"
  headline:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 62"
  title:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.75rem
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 62"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.25rem
  caption:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1rem
  label:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 75"
rounded:
  card: "4px"
  lg: "4px"
  full: "9999px"
spacing:
  page-x: "16px"
  row-x: "12px"
  row-y: "10px"
  card-pad: "16px"
  stack-sm: "6px"
  stack-md: "12px"
  section: "32px"
components:
  button-primary:
    backgroundColor: "{colors.shuttle}"
    textColor: "{colors.ink}"
    typography: "{typography.display}"
    rounded: "{rounded.lg}"
    height: "60px"
    width: "100%"
  button-primary-disabled:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink-faint}"
  button-secondary:
    backgroundColor: "{colors.challenge}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    padding: "12px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface-input}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
  player-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    height: "36px"
    padding: "0 12px"
  player-chip-side-a:
    backgroundColor: "{colors.win}"
    textColor: "{colors.tape}"
  player-chip-side-b:
    backgroundColor: "{colors.challenge}"
    textColor: "{colors.tape}"
  badge-run:
    backgroundColor: "{colors.shuttle}"
    textColor: "{colors.ink}"
    rounded: "4px"
    padding: "2px 8px"
  badge-seven-nil:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    rounded: "4px"
    padding: "2px 8px"
  court:
    backgroundColor: "{colors.court}"
    textColor: "{colors.tape}"
  court-step-plus:
    backgroundColor: "{colors.tape}"
    textColor: "{colors.court}"
    rounded: "{rounded.lg}"
    size: "48px"
  tab-bar:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.shuttle}"
    height: "64px"
---

# Design System: Badd Boys

## Overview

**Creative North Star: "The Hall Is the Interface"**

The app is drawn from the sports hall it is used in. The ground is a cool, light hall floor under bright overhead lighting; content sits on it as flat white fields, like panels laid on the boards. The court mat is green, the only marks on green are white line tape, and the one bright thing you reach for is shuttle-tube yellow. Nothing glows and nothing floats: the previous dark arena with neon glows was deliberately left behind, and so was the generic white rounded-card tracker.

Density is phone-courtside: one column, at most 480px, big touch targets, and every number in tabular figures so scores never jog. Type is a single family, Archivo, split by its width axis: extra-condensed heavy caps for names, scores and headings, normal width for anything you actually read. The signature is the score pad drawn as a top-down doubles court; the brand mark is the same court in miniature, with the net in yellow.

Full-screen moments flip the ground rather than adding effects: a run of three turns the whole screen shuttle yellow, a 7–0 turns it ink.

**Key Characteristics:**
- Light hall-floor ground, white flat fields, no borders at rest, no shadows.
- Court green for the court, the side holding it, and every win; white tape as the only lines on green.
- Shuttle yellow for the one primary action, runs and honors; challenger blue for the other side.
- Archivo throughout, width axis doing the work: 62% caps for display, normal width for body.
- Tight 4px corners, like taped lines; pills only for players and toggles.
- An ink tab bar anchors the bottom.

## Colors

A sports-hall palette: pale floor, white panels, mat green, line-tape white, shuttle yellow, with one blue for the challenger.

### Primary
- **Court Mat Green** (court): the court surface itself, the brand mark tile, and the full-bleed score pad.
- **Holding Green** (win): text-strength green for wins, the side holding the court (Lið A chips), positive records and the live/leading inset edge. Deep enough to read as text on the floor.
- **Net Shadow Green** (court-deep): the net band under its mesh and the swap button's rim.
- **Win Wash** (win-dim): background tint for the leading row in tonight's standings.

### Secondary
- **Shuttle-Tube Yellow** (shuttle): the primary action fill, run and honor badges, the active tab, the leading score on the court, the run-of-three celebration ground, and text selection. Always a fill with ink on it, or a mark on green/ink; never text on the light floor.
- **Shuttle Ink** (flame): the readable brown-gold for run text on light grounds, where yellow itself would fail contrast.

### Tertiary
- **Challenger Blue** (challenge): the challenging side (Lið B label and chips), the focus ring, active sort toggles, secondary actions and the "logged elsewhere" label.
- **Challenger Wash** (challenge-dim): tint for challenger-side backgrounds.

### Neutral
- **Hall Floor** (canvas): page ground, header, theme color, and text on ink/blue fills.
- **Panel White** (surface / surface-input): cards, lists, inputs, idle player chips.
- **Raised Floor** (surface-raised): inactive toggles, disabled primary button, inline add-player panel.
- **Seam** (line): dividers inside cards, header rule, input and chip strokes.
- **Bright Seam** (line-bright): dashed add affordances and dimmed avatar rims.
- **Court Ink** (ink): primary text, the tab bar, ink avatar kit, the 7–0 badge and the 7–0 full-screen ground.
- **Muted Ink** (ink-muted) and **Faint Ink** (ink-faint): secondary text and meta/labels respectively.
- **Line Tape** (tape): white lines and text on green, blue and ink.
- **Danger Red** (danger): deletion and errors only.

### Named Rules
**The Tape Rule.** On green, the only lines and text are white tape (3px strokes on the court). No tints, no greys, no outlines in other colors; the leading score is the single exception and it turns shuttle yellow.

**The One Yellow Button Rule.** A screen has one shuttle-yellow action, full width, ink text. Every other action is blue, outlined or plain.

**The Two Sides Rule.** Green is the side holding the court and every win; blue is the challenger. Do not swap them or use either decoratively.

## Typography

**Display Font:** Archivo variable, width 62%, weight 800, uppercase (with Arial Narrow)
**Body Font:** Archivo variable, normal width (with system-ui)
**Label Font:** Archivo variable, width 75%, weight 700, uppercase

**Character:** One family whose width axis carries the hierarchy: compressed heavy caps read like hall signage and scoreboard numerals; normal-width Archivo stays plain and legible for sentences.

### Hierarchy
- **Score** (800, 4rem on the court and up to 8rem for the 7–0 moment, line-height 0.85, tabular): court scores and full-screen numerals.
- **Display** (800, 1.75rem, line-height 1): the page's working heading ("Leikur 10"); full-screen headlines go to 2.5rem–4.5rem.
- **Headline** (800, 1.375rem, line-height 1): section titles and names in service boxes; the wordmark sits at 1.625rem.
- **Title** (800, 1.125rem–1.25rem): player names in rows, win–loss figures, card headings.
- **Body** (400, 0.875rem/1.25rem): explanations, notes, errors. Sentences only, never in caps.
- **Caption** (500, 0.75rem/1rem): meta lines, dates, game numbers, header status.
- **Label** (700, 0.8125rem, 0.06em tracking, uppercase, 75% width): form labels, region labels on a card or group, and back links.

### Named Rules
**The Width Axis Rule.** Hierarchy comes from width and weight in one family. Never introduce a second display face.

**The Tabular Rule.** Every score, record and count uses tabular figures.

**The Label Not Kicker Rule.** The label style names a control, a form field, a region inside a card, or a back link. It never sits above a page or section heading as a kicker.

## Layout

A single centered column, max 480px wide, with 16px page gutters; the shell is pinned to the screen with the header on top and an ink tab bar at the bottom, and only the page between them scrolls. The court is the only full-bleed element: it breaks out of the gutter (-16px) so the green mat runs edge to edge. Sections separate with 32px above section titles and 12px below. Lists are single cards divided by seams, rows at 12px by 10px. Chip groups and badge groups gap at 6px. Primary actions are full width and tall (52–60px); every touch target is at least 44px. Entry flows top to bottom: pick players, set score on the court, log with the yellow button.

## Elevation & Depth

Flat. There are no drop shadows anywhere. Depth comes from tonal ground changes (floor, white field, raised floor) and from inverting the whole screen for moments (yellow, ink). The only box-shadows are inset 2px edges used as marks for state, not depth.

### Shadow Vocabulary
- **Live mark** (`box-shadow: inset 0 0 0 2px var(--color-win)`): a card that is live, leading or a record.
- **Challenge mark** (`box-shadow: inset 0 0 0 2px var(--color-challenge)`): the challenger equivalent.
- **Run mark** (`box-shadow: inset 0 0 0 2px var(--color-shuttle)`): a card about a run or honor.

### Named Rules
**The No Glow Rule.** Nothing glows, blurs or floats. State is a solid inset edge or a fill change.

## Shapes

Tight 4px corners on cards, buttons, inputs, badges and the score steppers, like the ends of taped lines. Full pills only for player chips, sort toggles, avatars and the round swap button sitting on the net. Lines on the court are 3px white strokes; the net is a 4px tape top over a 7px mesh. The brand mark is a court drawn from above on a green rounded tile with a yellow net.

## Components

### Buttons
Heavy, compressed and obvious.
- **Shape:** tight corners (4px).
- **Primary:** shuttle yellow fill, ink text, display type at 1.25–1.5rem, full width, 52–60px tall. Pressed darkens slightly; disabled drops to raised floor with faint ink.
- **Secondary:** challenger blue fill with floor-colored text, display type, full width.
- **Ghost / Add:** dashed bright-seam outline, muted ink label text.
- **On ink:** the celebration's dismiss button inverts to ink fill with yellow text.

### Chips
- **Player chips:** 36px pills, 2px rim, display type. Idle: white with seam rim. Placed on side A: green fill; side B: blue fill; both with white text.
- **Sort toggles:** small pills; active is blue text on a blue wash with a blue rim, idle is faint ink on raised floor.

### Badges
Small 4px-corner display-type tags: yellow with ink for runs and "Þrír í röð", ink with floor text for 7–0, and plain green/faint text for a personal win or loss. Medal squares on the leaderboard use yellow for first.

### Cards / Containers
- **Corner Style:** 4px.
- **Background:** panel white on the hall floor.
- **Shadow Strategy:** none; state uses the inset marks above.
- **Border:** transparent at rest; a faint tinted border only for danger or confirmation panels.
- **Internal Padding:** 16px (20–24px for empty states and gates). Lists live inside one card with seam dividers and no internal padding.

### Inputs / Fields
- **Style:** panel white, 1px seam stroke, 4px corners, generous padding.
- **Focus:** the stroke turns challenger blue; keyboard focus everywhere is a 3px challenger-blue outline offset 2px.
- **Error:** a danger-red line of body text below the field.

### Navigation
The tab bar is an ink band, 56px tall plus the home-indicator inset less 12px, four equal tabs with 22px line icons over compressed caps labels. The active tab turns shuttle yellow with a 3px yellow top bar and a 20% fill in its icon; idle tabs are a soft grey on ink. The header is light floor with the court mark, the condensed wordmark and a caption-size status line.

### Avatars
Initials in compressed caps on a 2px-rimmed circle, in one of three court kits chosen from the player id: ink, court green, or white with an ink rim. Dimmed avatars (not played) are transparent with a bright-seam rim.

### Court (signature)
The score pad drawn as a top-down doubles court, full bleed in court green inside a 3px white tape boundary. Each half stacks back alley (side label tag, "Setja 11" and "7–0" outlined shortcuts), two service boxes holding player names, and the front zone with a minus stepper (outlined), the score, and a plus stepper (solid white with green glyph). Side B mirrors side A across the net band, which carries the round swap button. The leading score turns shuttle yellow. Shared by logging and editing a game.

### Run Strip
A 4px-corner strip above the court naming the pair holding the court: a square count tile plus names and a caption. White at rest, yellow tile once on a run, the whole strip yellow with an ink tile when the pair must split.

### Full-Screen Moments
Run of three: the screen becomes shuttle yellow with white cards, ink display type and an ink dismiss button. 7–0: the screen becomes ink with an 8rem white score, yellow headline and a yellow dismiss button. Both enter with a short pop-in and rise (0.3–0.4s, ease-out expo) and honor reduced motion.

## Do's and Don'ts

### Do:
- **Do** keep the page on the hall floor (canvas) with flat white fields for content.
- **Do** draw anything on green with white tape only, at 3px.
- **Do** give each screen exactly one full-width shuttle-yellow action with ink text.
- **Do** use green for the side holding the court and for wins, blue for the challenger.
- **Do** set scores, names and headings in Archivo at 62% width, weight 800, uppercase, with tabular figures for numbers.
- **Do** mark live or record state with a 2px inset edge, not a shadow.
- **Do** keep corners at 4px, reserving pills for players, toggles and avatars.

### Don't:
- **Don't** add drop shadows, glows or blurs; the dark neon arena is the rejected world.
- **Don't** set shuttle yellow as text on the light floor; use flame for readable run text.
- **Don't** use the label style as a kicker above a heading.
- **Don't** introduce a second typeface or a system display face.
- **Don't** use danger red for anything but deletion and errors.
- **Don't** round cards beyond 4px or give them visible borders at rest.
