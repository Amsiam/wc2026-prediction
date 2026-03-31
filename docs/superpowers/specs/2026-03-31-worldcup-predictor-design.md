# 2026 FIFA World Cup Predictor — Design Spec

**Date:** 2026-03-31  
**Stack:** TanStack Start, React, TypeScript  
**Status:** Approved

---

## Overview

A web app where users predict the 2026 FIFA World Cup — picking group stage qualifiers and knockout round winners — then generate a shareable bracket image and winner card.

---

## Tournament Format

- 48 teams across 16 groups of 3 (Groups A–P)
- Top 2 from each group + 8 best 3rd-place teams = 32 teams enter the knockout stage
- Knockout: Round of 32 → Round of 16 → Quarterfinals → Semifinals → Final
- 3rd place play-off between the two SF losers

---

## Architecture

### Routing

```
/                  → redirects to /predictor
/predictor         → main app shell (tabbed UI)
  ?picks=<base64>  → hydrates picks from shareable URL
```

### State Management

A single `BracketStore` (Zustand or TanStack Store) holds all user picks.

On every state change:
1. Serialises picks to base64 JSON
2. Writes to `localStorage` (key: `wc2026_picks`)
3. Updates `?picks=` URL query param (replaces history entry)

On app load, hydration order:
1. URL `?picks=` param (shared link takes priority)
2. `localStorage` fallback
3. Empty state (fresh start)

### Static Data

`src/data/teams.ts` — hardcoded 2026 group draw:
- 16 groups, 3 teams each
- Each team: `{ id, name, code, flag }` (flag = emoji or SVG path)
- No API calls; data is static at build time

---

## UI Structure

### App Shell

- Header with app title and "Copy shareable link" button
- Two tabs: **Group Stage** | **Knockout**
- Both tabs are always accessible — Knockout tab is never locked
- Progress indicator: "X / 32 teams placed" (tracks how many teams have been anchored in the bracket)

---

## Tab 1: Group Stage

### Layout

- Responsive grid of 16 group cards
  - Desktop: 4 columns
  - Tablet: 2 columns
  - Mobile: 1 column

### Group Card

Each card contains:
- Group label (e.g. "Group A")
- 3 teams (flag + name)
- Two pick slots: **1st place** and **2nd place**
- A **3rd-place rank** input (1–16) for tiebreaker resolution

### Interaction

- Click a team → assign to 1st place slot; click again → assign to 2nd place
- Clicking a picked team deselects it
- 3rd-place rank (1 = best, 16 = worst) is set per group
- The 8 best 3rd-place qualifiers are **auto-resolved** by the store: sort all 16 third-place teams by their assigned rank, take the top 8
- Changing a group pick resets any knockout picks that depended on that team

### 3rd-Place Rank

The rank field (1 = best, 16 = worst) is a user-assigned tiebreaker. The store sorts all 16 third-place teams by this rank and takes the top 8 as qualifiers. This is a simplification — the official FIFA tiebreaker uses group-stage points/GD, but since this is a predictor (not a simulator), user-assigned rank is the pragmatic approach.

### R32 Seeding

The official 2026 FIFA R32 bracket seeds are pre-defined (group winners vs. specific 3rd-place qualifiers in a fixed draw table). The static data file will include a `r32Fixtures` table mapping match slots to their expected seed sources (e.g. "Winner Group A vs 3rd-place from Groups B/C/D"). This table is hardcoded from the official FIFA draw formula.

### Relationship to Knockout Tab

The Group Stage tab is **optional but complementary**. Picks made here (group 1st/2nd) auto-anchor those teams to their correct R32 seed slots in the Knockout tab. Conversely, when the Knockout tab prompts for a team's group position, the answer is saved back to the Group Stage state.

### Validation

- A group is "complete" when 1st and 2nd are both picked
- Group Stage completion is not required to use the Knockout tab

---

## Tab 2: Knockout Bracket

### Structure

```
Round of 32 (16 matches)
  → Round of 16 (8 matches)
    → Quarterfinals (4 matches)
      → Semifinals (2 matches)
        → Final (1 match) → Champion
3rd Place Play-off (1 match, below main bracket)
```

### Layout

- Traditional left-right bracket tree
- Left half: 8 R32 matches feed left side of Final
- Right half: 8 R32 matches feed right side of Final
- Champion displayed in the centre
- 3rd place match card displayed below the bracket

### Match Card States

| State | Display |
|---|---|
| Unpicked | Both teams shown, no highlight |
| Picked | Winner highlighted, loser dimmed |
| Locked (TBD) | Slot shows "TBD" |

### Interaction — Core Principle (Pathway / Top-Down Selection)

The user picks a team at **any bracket point** — including the Final — and the app **back-fills** that team as the winner through all prior rounds on their path.

**Example flow:**
1. User opens the Knockout tab. All slots show "TBD".
2. User clicks the Final slot.
3. A **team picker** opens showing only the teams **eligible for that Final slot** — i.e. all teams seeded into the left half of the bracket (filtered to teams not already placed elsewhere).
4. User selects Argentina.
5. App prompts: *"Which position did Argentina finish in their group? (1st / 2nd)"* (if not already known from Group Stage tab).
6. User picks 1st → Argentina anchored to their correct R32 seed slot.
7. App auto-fills Argentina as winner in: R32 → R16 → QF → SF → Final (their full path).

### Team Picker — Eligible Teams Per Slot

When the user clicks any bracket slot, the picker shows only the **possible teams for that specific position** based on the FIFA seeding structure:

- **R32 slot:** Shows only the 2–3 teams from the specific groups that feed that slot (per the FIFA draw table). E.g. a slot fed by "Winner Group A" shows only Group A's 3 teams.
- **R16 slot:** Shows all teams that could possibly reach that slot — the union of eligible teams from the two R32 matches that feed it.
- **QF slot:** Union of eligible teams from the two R16 matches that feed it.
- **SF slot:** Union of eligible teams from the two QF matches that feed it.
- **Final slot:** All teams in that half of the bracket.

The picker list is **dynamically filtered** — it only ever shows teams that are still alive at that point:

- If a team has already been picked as a **loser** (i.e. they were selected in a lower round but their opponent was chosen to advance), they are **excluded** from all subsequent round pickers
- Example: if France lost in R16, France will not appear in QF, SF, or Final pickers
- Only teams with a plausible path to that slot — and who have not been eliminated — are shown

Teams with confirmed group positions are shown with flag + name. Unanchored teams (group position not yet set) are shown with a "?" indicator but are still selectable.

**Rules:**
- User can select a team at any round — Final, SF, QF, R16, or R32
- Selecting a team at round N back-fills them as winner in rounds 1 through N−1 on their path
- If a selected team's group position is unknown, a modal/prompt asks for it (1st or 2nd in group)
- This anchors the team to the correct bracket seed slot per the FIFA R32 draw table
- Changing a pick removes that team from all rounds above and clears the path back to "TBD"
- 3rd place match auto-populates with the two SF losers once both semis are decided

---

## Image Generation

### Trigger

A **"Generate & Share"** button in the app header/footer, enabled only when:
- The Final winner is picked
- The 3rd place match winner is picked

### Output 1: Full Bracket Image

- Renders the complete knockout bracket (R32 → Final) in a hidden off-screen div
- Fixed dimensions: **1200 × 800 px**
- Captured with `html2canvas` → downloads as `worldcup-2026-bracket.png`

### Output 2: Winner Card

- A compact podium card: Champion (1st), Runner-up (2nd), 3rd place
- Each entry shows: flag, team name, finishing position
- Fixed dimensions: **800 × 450 px**
- Captured with `html2canvas` → downloads as `worldcup-2026-winner.png`

### Implementation Notes

- Hidden render divs use fixed pixel dimensions independent of screen size for consistent output
- Both images generated client-side; no server required
- "Copy shareable link" copies the current `?picks=...` URL to clipboard

---

## Persistence & Sharing

| Mechanism | Behaviour |
|---|---|
| `localStorage` | Picks auto-saved on every change; restored on next visit |
| `?p=` URL param | Compact bitfield string; shared links hydrate on load |
| Priority | URL param > localStorage > empty state |

### URL Encoding — Compact Bitfield

Picks are encoded as a **bitfield**, not JSON. All team data lives in the static `teams.ts` file — the URL only needs to encode *choices*, not team names.

**Group Stage (48 bits = 6 bytes):**
- Per group: 2 bits for 1st place (which of 3 teams: 0/1/2) + 1 bit for 2nd place (which of remaining 2: 0/1)
- 3 bits × 16 groups = 48 bits

**Knockout (63 bits = 8 bytes):**
- Each of the 63 matches encodes 1 bit: which side advanced (0 = left, 1 = right)
- R32 (32 matches) + R16 (16) + QF (8) + SF (4) + Final (2) + 3rd place (1) = 63 bits

**Total: 111 bits → 14 bytes → base64url → ~19 characters**

Example URL: `https://wc2026.app/predictor?p=aGVsbG93b3JsZA`

No JSON, no team IDs, no padding — just a fixed-length bitfield. Invalid or incomplete bitfields fall back gracefully to empty state.

---

## Data Shape (TypeScript sketch)

```ts
type TeamId = string; // e.g. "ARG", "BRA"

interface GroupPick {
  first: TeamId | null;
  second: TeamId | null;
  thirdRank: number | null; // 1–16
}

interface MatchPick {
  winner: TeamId | null;
}

interface BracketState {
  groups: Record<string, GroupPick>;       // key: "A"–"P"
  roundOf32: Record<string, MatchPick>;    // key: match id
  roundOf16: Record<string, MatchPick>;
  quarters: Record<string, MatchPick>;
  semis: Record<string, MatchPick>;
  final: MatchPick;
  thirdPlace: MatchPick;
}
```

---

## Out of Scope (v1)

- User accounts / cloud persistence
- Score/points predictions
- Live tournament data sync
- Mobile app
- Social sharing (beyond copy link + image download)
