# World Cup 2026 Predictor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TanStack Start web app where users predict the 2026 FIFA World Cup bracket, with pathway-based selection, automatic back-fill, and client-side image generation.

**Architecture:** A Zustand store holds all bracket state. The Knockout tab uses pathway-based selection — clicking any slot shows only eligible + alive teams, and picking one back-fills their entire path. State is persisted to localStorage and a compact bitfield URL param.

**Tech Stack:** TanStack Start, React 19, TypeScript, Zustand, html2canvas, Vitest, React Testing Library

---

## File Map

| File | Responsibility |
|---|---|
| `app/routes/__root.tsx` | Root layout: fonts, meta |
| `app/routes/index.tsx` | Redirect → /predictor |
| `app/routes/predictor.tsx` | App shell with tab state |
| `app/data/teams.ts` | 48 teams, 16 groups, r32Fixtures table |
| `app/store/types.ts` | All TypeScript types for bracket state |
| `app/store/bracketStore.ts` | Zustand store + all actions |
| `app/store/selectors.ts` | Derived state: eligibleTeams, isEliminated, placedCount |
| `app/lib/encoding.ts` | Bitfield encode/decode for `?p=` URL param |
| `app/lib/eligible.ts` | Compute eligible team set for a bracket slot |
| `app/hooks/usePersistence.ts` | Sync store → localStorage + URL on every change |
| `app/components/AppShell.tsx` | Header, tab nav, progress indicator |
| `app/components/GroupStage/GroupCard.tsx` | Single group card with pick interaction |
| `app/components/GroupStage/GroupGrid.tsx` | 16-card responsive grid |
| `app/components/Knockout/MatchSlot.tsx` | Single match node (2 team slots, clickable) |
| `app/components/Knockout/TeamPicker.tsx` | Modal: list eligible teams for a slot |
| `app/components/Knockout/GroupPositionModal.tsx` | Modal: ask 1st or 2nd when anchoring a team |
| `app/components/Knockout/BracketView.tsx` | Full bracket tree layout (left/right halves) |
| `app/components/ImageGen/BracketCanvas.tsx` | Hidden 1200×800 bracket render for html2canvas |
| `app/components/ImageGen/WinnerCard.tsx` | Hidden 800×450 winner card render |
| `app/components/ImageGen/GenerateButton.tsx` | Capture buttons + copy-link |

---

## Task 1: Scaffold Project + Install Dependencies

**Files:**
- Create: `app/` (TanStack Start scaffold)
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`

- [ ] **Step 1: Create TanStack Start project**

```bash
npx create-tsrouter-app@latest . --framework react --target start --typescript
```

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install zustand html2canvas
```

- [ ] **Step 3: Install dev/test dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

- [ ] **Step 4: Add vitest config to `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

export default defineConfig({
  plugins: [tsConfigPaths(), tanstackStart()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 5: Create test setup file**

Create `src/test-setup.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Add test script to `package.json`**

In `package.json` scripts, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```
Expected: Server running at `http://localhost:3000`

- [ ] **Step 8: Commit**

```bash
git init && git add -A
git commit -m "feat: scaffold TanStack Start project with Vitest"
```

---

## Task 2: Static Team Data

**Files:**
- Create: `app/data/teams.ts`

- [ ] **Step 1: Create the teams data file**

Create `app/data/teams.ts`:

```ts
export interface Team {
  id: string        // FIFA 3-letter code, e.g. "ARG"
  name: string      // Full name, e.g. "Argentina"
  flag: string      // Emoji flag, e.g. "🇦🇷"
  group: string     // "A"–"P"
}

// Source: Official FIFA 2026 World Cup Draw (December 5, 2024)
// Verify at: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026
export const TEAMS: Team[] = [
  // Group A
  { id: 'USA', name: 'United States', flag: '🇺🇸', group: 'A' },
  { id: 'PAN', name: 'Panama', flag: '🇵🇦', group: 'A' },
  { id: 'ALB', name: 'Albania', flag: '🇦🇱', group: 'A' },
  // Group B
  { id: 'ARG', name: 'Argentina', flag: '🇦🇷', group: 'B' },
  { id: 'CHI', name: 'Chile', flag: '🇨🇱', group: 'B' },
  { id: 'ALG', name: 'Algeria', flag: '🇩🇿', group: 'B' },
  // Group C
  { id: 'MEX', name: 'Mexico', flag: '🇲🇽', group: 'C' },
  { id: 'ECU', name: 'Ecuador', flag: '🇪🇨', group: 'C' },
  { id: 'NZL', name: 'New Zealand', flag: '🇳🇿', group: 'C' },
  // Group D
  { id: 'FRA', name: 'France', flag: '🇫🇷', group: 'D' },
  { id: 'CIV', name: 'Ivory Coast', flag: '🇨🇮', group: 'D' },
  { id: 'TOT', name: 'Togo', flag: '🇹🇬', group: 'D' },   // placeholder — verify
  // Group E
  { id: 'ESP', name: 'Spain', flag: '🇪🇸', group: 'E' },
  { id: 'BRA', name: 'Brazil', flag: '🇧🇷', group: 'E' },
  { id: 'COD', name: 'DR Congo', flag: '🇨🇩', group: 'E' },
  // Group F
  { id: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'F' },
  { id: 'NED', name: 'Netherlands', flag: '🇳🇱', group: 'F' },
  { id: 'SEN', name: 'Senegal', flag: '🇸🇳', group: 'F' },
  // Group G
  { id: 'GER', name: 'Germany', flag: '🇩🇪', group: 'G' },
  { id: 'COL', name: 'Colombia', flag: '🇨🇴', group: 'G' },
  { id: 'KOR', name: 'South Korea', flag: '🇰🇷', group: 'G' },
  // Group H
  { id: 'POR', name: 'Portugal', flag: '🇵🇹', group: 'H' },
  { id: 'CRO', name: 'Croatia', flag: '🇭🇷', group: 'H' },
  { id: 'CAM', name: 'Cameroon', flag: '🇨🇲', group: 'H' },
  // Group I
  { id: 'JPN', name: 'Japan', flag: '🇯🇵', group: 'I' },
  { id: 'URU', name: 'Uruguay', flag: '🇺🇾', group: 'I' },
  { id: 'MAD', name: 'Madagascar', flag: '🇲🇬', group: 'I' }, // placeholder — verify
  // Group J
  { id: 'BEL', name: 'Belgium', flag: '🇧🇪', group: 'J' },
  { id: 'MEX2', name: 'Morocco', flag: '🇲🇦', group: 'J' }, // placeholder id — fix
  { id: 'PAR', name: 'Paraguay', flag: '🇵🇾', group: 'J' },
  // Group K
  { id: 'AUS', name: 'Australia', flag: '🇦🇺', group: 'K' },
  { id: 'TUR', name: 'Turkey', flag: '🇹🇷', group: 'K' },
  { id: 'GHA', name: 'Ghana', flag: '🇬🇭', group: 'K' },
  // Group L
  { id: 'SUI', name: 'Switzerland', flag: '🇨🇭', group: 'L' },
  { id: 'VEN', name: 'Venezuela', flag: '🇻🇪', group: 'L' },
  { id: 'TUN', name: 'Tunisia', flag: '🇹🇳', group: 'L' },
  // Group M
  { id: 'CAN', name: 'Canada', flag: '🇨🇦', group: 'M' },
  { id: 'AUT', name: 'Austria', flag: '🇦🇹', group: 'M' },
  { id: 'NIG', name: 'Nigeria', flag: '🇳🇬', group: 'M' },
  // Group N
  { id: 'DEN', name: 'Denmark', flag: '🇩🇰', group: 'N' },
  { id: 'PER', name: 'Peru', flag: '🇵🇪', group: 'N' },
  { id: 'MOR', name: 'Morocco', flag: '🇲🇦', group: 'N' }, // placeholder — verify
  // Group O
  { id: 'ITA', name: 'Italy', flag: '🇮🇹', group: 'O' },
  { id: 'MEX3', name: 'Mexico', flag: '🇲🇽', group: 'O' }, // placeholder — fix
  { id: 'IRN', name: 'Iran', flag: '🇮🇷', group: 'O' },
  // Group P
  { id: 'POL', name: 'Poland', flag: '🇵🇱', group: 'P' },
  { id: 'SAU', name: 'Saudi Arabia', flag: '🇸🇦', group: 'P' },
  { id: 'NOR', name: 'Norway', flag: '🇳🇴', group: 'P' },
]

// ⚠️  IMPORTANT: The team data above is approximate.
// Verify all 48 teams and group assignments against the official FIFA draw:
// https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026
// Fix any placeholder IDs (MEX2, MEX3, etc.) with correct FIFA codes.

export const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'] as const
export type GroupKey = typeof GROUPS[number]

export function getGroup(key: GroupKey): Team[] {
  return TEAMS.filter(t => t.group === key)
}

export function getTeamById(id: string): Team | undefined {
  return TEAMS.find(t => t.id === id)
}

// R32 bracket fixtures — pre-determined by FIFA draw
// Each entry defines a match slot: which seed sources feed it
// source: "winner" | "runner" | "third"
// Verify bracket pairings at: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/bracket
export interface SeedSource {
  source: 'winner' | 'runner' | 'third'
  group: GroupKey
}

export interface R32Fixture {
  id: string        // e.g. "r32_m1"
  home: SeedSource  // left side of match
  away: SeedSource  // right side of match
  bracket: 'left' | 'right'  // which half of the final bracket
}

// ⚠️  Fill in exact pairings from official FIFA R32 draw:
export const R32_FIXTURES: R32Fixture[] = [
  { id: 'r32_m1',  home: { source: 'winner', group: 'A' }, away: { source: 'runner', group: 'B' }, bracket: 'left' },
  { id: 'r32_m2',  home: { source: 'winner', group: 'C' }, away: { source: 'runner', group: 'D' }, bracket: 'left' },
  { id: 'r32_m3',  home: { source: 'winner', group: 'E' }, away: { source: 'runner', group: 'F' }, bracket: 'left' },
  { id: 'r32_m4',  home: { source: 'winner', group: 'G' }, away: { source: 'runner', group: 'H' }, bracket: 'left' },
  { id: 'r32_m5',  home: { source: 'winner', group: 'B' }, away: { source: 'runner', group: 'A' }, bracket: 'left' },
  { id: 'r32_m6',  home: { source: 'winner', group: 'D' }, away: { source: 'runner', group: 'C' }, bracket: 'left' },
  { id: 'r32_m7',  home: { source: 'winner', group: 'F' }, away: { source: 'runner', group: 'E' }, bracket: 'left' },
  { id: 'r32_m8',  home: { source: 'winner', group: 'H' }, away: { source: 'runner', group: 'G' }, bracket: 'left' },
  { id: 'r32_m9',  home: { source: 'winner', group: 'I' }, away: { source: 'runner', group: 'J' }, bracket: 'right' },
  { id: 'r32_m10', home: { source: 'winner', group: 'K' }, away: { source: 'runner', group: 'L' }, bracket: 'right' },
  { id: 'r32_m11', home: { source: 'winner', group: 'M' }, away: { source: 'runner', group: 'N' }, bracket: 'right' },
  { id: 'r32_m12', home: { source: 'winner', group: 'O' }, away: { source: 'runner', group: 'P' }, bracket: 'right' },
  { id: 'r32_m13', home: { source: 'winner', group: 'J' }, away: { source: 'runner', group: 'I' }, bracket: 'right' },
  { id: 'r32_m14', home: { source: 'winner', group: 'L' }, away: { source: 'runner', group: 'K' }, bracket: 'right' },
  { id: 'r32_m15', home: { source: 'winner', group: 'N' }, away: { source: 'runner', group: 'M' }, bracket: 'right' },
  { id: 'r32_m16', home: { source: 'winner', group: 'P' }, away: { source: 'runner', group: 'O' }, bracket: 'right' },
]

// Bracket tree: which R32 match pairs feed each R16 match, etc.
// Structure: [homeMatchId, awayMatchId] → nextMatchId
export const BRACKET_TREE = {
  // R32 → R16
  r16_m1: ['r32_m1', 'r32_m2'],
  r16_m2: ['r32_m3', 'r32_m4'],
  r16_m3: ['r32_m5', 'r32_m6'],
  r16_m4: ['r32_m7', 'r32_m8'],
  r16_m5: ['r32_m9',  'r32_m10'],
  r16_m6: ['r32_m11', 'r32_m12'],
  r16_m7: ['r32_m13', 'r32_m14'],
  r16_m8: ['r32_m15', 'r32_m16'],
  // R16 → QF
  qf_m1: ['r16_m1', 'r16_m2'],
  qf_m2: ['r16_m3', 'r16_m4'],
  qf_m3: ['r16_m5', 'r16_m6'],
  qf_m4: ['r16_m7', 'r16_m8'],
  // QF → SF
  sf_m1: ['qf_m1', 'qf_m2'],
  sf_m2: ['qf_m3', 'qf_m4'],
  // SF → Final
  final: ['sf_m1', 'sf_m2'],
  third_place: ['sf_m1', 'sf_m2'], // losers
} as const

export type MatchId =
  | `r32_m${number}`
  | `r16_m${number}`
  | `qf_m${number}`
  | `sf_m${number}`
  | 'final'
  | 'third_place'

export const ALL_MATCH_IDS: MatchId[] = [
  'r32_m1','r32_m2','r32_m3','r32_m4','r32_m5','r32_m6','r32_m7','r32_m8',
  'r32_m9','r32_m10','r32_m11','r32_m12','r32_m13','r32_m14','r32_m15','r32_m16',
  'r16_m1','r16_m2','r16_m3','r16_m4','r16_m5','r16_m6','r16_m7','r16_m8',
  'qf_m1','qf_m2','qf_m3','qf_m4',
  'sf_m1','sf_m2',
  'final',
  'third_place',
]
```

- [ ] **Step 2: Commit**

```bash
git add app/data/teams.ts
git commit -m "feat: add static 2026 team data and bracket tree"
```

---

## Task 3: State Types

**Files:**
- Create: `app/store/types.ts`

- [ ] **Step 1: Write types**

Create `app/store/types.ts`:

```ts
import type { GroupKey, MatchId } from '../data/teams'

export type TeamId = string // FIFA 3-letter code

export interface GroupPick {
  first: TeamId | null
  second: TeamId | null
  thirdRank: number | null // 1=best qualifier, 16=worst; null=unset
}

export interface MatchPick {
  winner: TeamId | null
}

export interface BracketState {
  groups: Record<GroupKey, GroupPick>
  matches: Record<MatchId, MatchPick>
}

// Which round a match belongs to
export type Round = 'r32' | 'r16' | 'qf' | 'sf' | 'final' | 'third_place'

export function getRound(matchId: MatchId): Round {
  if (matchId === 'final') return 'final'
  if (matchId === 'third_place') return 'third_place'
  if (matchId.startsWith('r32')) return 'r32'
  if (matchId.startsWith('r16')) return 'r16'
  if (matchId.startsWith('qf')) return 'qf'
  return 'sf'
}

// A team "slot" in a match: which side (home/away)
export interface MatchSlotId {
  matchId: MatchId
  side: 'home' | 'away'
}
```

- [ ] **Step 2: Commit**

```bash
git add app/store/types.ts
git commit -m "feat: add bracket state types"
```

---

## Task 4: Bitfield Encoding Library

**Files:**
- Create: `app/lib/encoding.ts`
- Create: `app/lib/encoding.test.ts`

**Encoding scheme (160 bits total → 20 bytes → ~27 base64url chars):**
- Per group (8 bits × 16 groups = 128 bits):
  - bits[0-1]: 1st place index (0/1/2 = team index in group; 3 = null)
  - bit[2]: 2nd place (0 = first of remaining two; 1 = second; ignored if 1st=null)
  - bits[3-7]: thirdRank (0 = null; 1–16 = rank)
- Per match (1 bit × 32 matches = 32 bits):
  - 0 = home won; 1 = away won; read as 0/1 but we store null for "unset" separately
  - A parallel 32-bit "set" mask tracks which matches have been picked

- [ ] **Step 1: Write the failing tests**

Create `app/lib/encoding.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { encodePicks, decodePicks, EMPTY_STATE } from './encoding'
import type { BracketState } from '../store/types'

describe('encodePicks / decodePicks', () => {
  it('roundtrips empty state', () => {
    const encoded = encodePicks(EMPTY_STATE)
    const decoded = decodePicks(encoded)
    expect(decoded).toEqual(EMPTY_STATE)
  })

  it('roundtrips group picks', () => {
    const state: BracketState = {
      ...EMPTY_STATE,
      groups: {
        ...EMPTY_STATE.groups,
        A: { first: 'USA', second: 'PAN', thirdRank: 3 },
      },
    }
    const decoded = decodePicks(encodePicks(state))
    expect(decoded.groups.A).toEqual({ first: 'USA', second: 'PAN', thirdRank: 3 })
  })

  it('roundtrips a knockout pick', () => {
    const state: BracketState = {
      ...EMPTY_STATE,
      matches: {
        ...EMPTY_STATE.matches,
        r32_m1: { winner: 'USA' },
      },
    }
    const decoded = decodePicks(encodePicks(state))
    expect(decoded.matches.r32_m1.winner).toBe('USA')
  })

  it('returns null for an invalid string', () => {
    expect(decodePicks('not-valid!!!')).toBeNull()
  })

  it('produces a string under 30 characters', () => {
    expect(encodePicks(EMPTY_STATE).length).toBeLessThan(30)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- encoding.test.ts
```
Expected: FAIL — `encoding.ts` does not exist yet.

- [ ] **Step 3: Implement encoding**

Create `app/lib/encoding.ts`:
```ts
import { GROUPS, TEAMS, ALL_MATCH_IDS, getGroup } from '../data/teams'
import type { BracketState, GroupPick, MatchPick } from '../store/types'
import type { GroupKey, MatchId } from '../data/teams'

// Build empty state helper
function emptyGroupPicks(): Record<GroupKey, GroupPick> {
  return Object.fromEntries(
    GROUPS.map(g => [g, { first: null, second: null, thirdRank: null }])
  ) as Record<GroupKey, GroupPick>
}

function emptyMatchPicks(): Record<MatchId, MatchPick> {
  return Object.fromEntries(
    ALL_MATCH_IDS.map(id => [id, { winner: null }])
  ) as Record<MatchId, MatchPick>
}

export const EMPTY_STATE: BracketState = {
  groups: emptyGroupPicks(),
  matches: emptyMatchPicks(),
}

// Encode to base64url string (~27 chars)
export function encodePicks(state: BracketState): string {
  // 128 bits for groups + 32 bits for match winners + 32 bits for "is set" mask
  // = 192 bits = 24 bytes
  const buf = new Uint8Array(24)
  let bitPos = 0

  function writeBits(value: number, count: number) {
    for (let i = count - 1; i >= 0; i--) {
      const bit = (value >> i) & 1
      const byteIdx = Math.floor(bitPos / 8)
      const bitIdx = 7 - (bitPos % 8)
      if (bit) buf[byteIdx] |= (1 << bitIdx)
      bitPos++
    }
  }

  // Groups: 8 bits each
  for (const g of GROUPS) {
    const pick = state.groups[g]
    const teams = getGroup(g)
    const firstIdx = pick.first ? teams.findIndex(t => t.id === pick.first) : -1
    const firstVal = firstIdx === -1 ? 3 : firstIdx  // 3 = null
    writeBits(firstVal, 2)

    if (firstIdx !== -1) {
      const remaining = teams.filter((_, i) => i !== firstIdx)
      const secondIdx = pick.second ? remaining.findIndex(t => t.id === pick.second) : 0
      writeBits(secondIdx === -1 ? 0 : secondIdx, 1)
    } else {
      writeBits(0, 1)
    }

    const rank = pick.thirdRank ?? 0  // 0 = null
    writeBits(rank, 5)
  }

  // Matches: 1 bit winner side + 1 bit "is set"
  for (const id of ALL_MATCH_IDS) {
    const pick = state.matches[id]
    const isSet = pick.winner !== null ? 1 : 0
    writeBits(isSet, 1)
  }
  for (const id of ALL_MATCH_IDS) {
    const pick = state.matches[id]
    if (pick.winner !== null) {
      // Determine if winner was home (0) or away (1)
      // We store the team ID for the winner; to encode we need to know which side
      // We encode: find the team in the bracket, but since we only have winner we
      // store a lookup: 0=first team alphabetically, 1=second
      // Simpler: store winner team index in ALL_MATCH_IDS list (use TEAMS index)
      const teamIdx = TEAMS.findIndex(t => t.id === pick.winner)
      // Store team index: 6 bits (0-47 for 48 teams; 63 = null)
      writeBits(teamIdx === -1 ? 63 : teamIdx, 6)
    } else {
      writeBits(63, 6) // null sentinel
    }
  }

  // Convert to base64url
  let binary = ''
  buf.forEach(b => binary += String.fromCharCode(b))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function decodePicks(encoded: string): BracketState | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const padLen = (4 - (padded.length % 4)) % 4
    const base64 = padded + '='.repeat(padLen)
    const binary = atob(base64)
    const buf = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i)

    let bitPos = 0
    function readBits(count: number): number {
      let value = 0
      for (let i = count - 1; i >= 0; i--) {
        const byteIdx = Math.floor(bitPos / 8)
        const bitIdx = 7 - (bitPos % 8)
        if (buf[byteIdx] & (1 << bitIdx)) value |= (1 << i)
        bitPos++
      }
      return value
    }

    const groups = emptyGroupPicks()
    for (const g of GROUPS) {
      const teams = getGroup(g)
      const firstVal = readBits(2)
      const secondBit = readBits(1)
      const rank = readBits(5)

      if (firstVal !== 3 && firstVal < teams.length) {
        groups[g].first = teams[firstVal].id
        const remaining = teams.filter((_, i) => i !== firstVal)
        if (secondBit < remaining.length) {
          groups[g].second = remaining[secondBit].id
        }
      }
      groups[g].thirdRank = rank === 0 ? null : rank
    }

    // Read "is set" mask
    const isSet: boolean[] = []
    for (let i = 0; i < ALL_MATCH_IDS.length; i++) {
      isSet.push(readBits(1) === 1)
    }

    const matches = emptyMatchPicks()
    for (let i = 0; i < ALL_MATCH_IDS.length; i++) {
      const teamIdx = readBits(6)
      if (isSet[i] && teamIdx !== 63 && teamIdx < TEAMS.length) {
        matches[ALL_MATCH_IDS[i]].winner = TEAMS[teamIdx].id
      }
    }

    return { groups, matches }
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- encoding.test.ts
```
Expected: All 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/lib/encoding.ts app/lib/encoding.test.ts
git commit -m "feat: add compact bitfield encoding for shareable URL"
```

---

## Task 5: Bracket Store

**Files:**
- Create: `app/store/bracketStore.ts`
- Create: `app/store/bracketStore.test.ts`

- [ ] **Step 1: Write failing tests**

Create `app/store/bracketStore.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createBracketStore } from './bracketStore'

describe('bracketStore', () => {
  let store: ReturnType<typeof createBracketStore>

  beforeEach(() => {
    store = createBracketStore()
  })

  it('starts with all picks null', () => {
    const s = store.getState()
    expect(s.groups.A.first).toBeNull()
    expect(s.matches.final.winner).toBeNull()
  })

  it('setGroupFirst sets first pick', () => {
    store.getState().setGroupFirst('A', 'USA')
    expect(store.getState().groups.A.first).toBe('USA')
  })

  it('setGroupSecond sets second pick', () => {
    store.getState().setGroupFirst('A', 'USA')
    store.getState().setGroupSecond('A', 'PAN')
    expect(store.getState().groups.A.second).toBe('PAN')
  })

  it('setGroupFirst to null clears second too', () => {
    store.getState().setGroupFirst('A', 'USA')
    store.getState().setGroupSecond('A', 'PAN')
    store.getState().setGroupFirst('A', null)
    expect(store.getState().groups.A.second).toBeNull()
  })

  it('setMatchWinner sets a knockout winner', () => {
    store.getState().setMatchWinner('r32_m1', 'USA')
    expect(store.getState().matches.r32_m1.winner).toBe('USA')
  })

  it('backfillPath sets winner in all prior rounds for a team', () => {
    // Selecting Argentina as Final winner should backfill sf_m1, qf_m1, r16_m1, r32_m1
    store.getState().backfillPath('final', 'ARG', 'home')
    const s = store.getState()
    expect(s.matches.final.winner).toBe('ARG')
    expect(s.matches.sf_m1.winner).toBe('ARG')
  })

  it('clearDownstream removes picks in rounds above the changed match', () => {
    store.getState().setMatchWinner('r32_m1', 'USA')
    store.getState().setMatchWinner('r16_m1', 'USA')
    store.getState().clearDownstream('r32_m1')
    expect(store.getState().matches.r16_m1.winner).toBeNull()
  })

  it('setThirdRank sets rank on group', () => {
    store.getState().setThirdRank('A', 5)
    expect(store.getState().groups.A.thirdRank).toBe(5)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- bracketStore.test.ts
```
Expected: FAIL — `bracketStore.ts` does not exist.

- [ ] **Step 3: Implement the store**

Create `app/store/bracketStore.ts`:
```ts
import { create, type StoreApi } from 'zustand'
import { EMPTY_STATE } from '../lib/encoding'
import { BRACKET_TREE, ALL_MATCH_IDS } from '../data/teams'
import type { BracketState, GroupPick } from './types'
import type { GroupKey, MatchId } from '../data/teams'
import type { TeamId } from './types'

export interface BracketActions {
  setGroupFirst: (group: GroupKey, teamId: TeamId | null) => void
  setGroupSecond: (group: GroupKey, teamId: TeamId | null) => void
  setThirdRank: (group: GroupKey, rank: number | null) => void
  setMatchWinner: (matchId: MatchId, teamId: TeamId | null) => void
  backfillPath: (matchId: MatchId, teamId: TeamId, side: 'home' | 'away') => void
  clearDownstream: (matchId: MatchId) => void
  loadState: (state: BracketState) => void
}

export type BracketStore = BracketState & BracketActions

// Build a map of matchId → parentMatchId (the match that feeds this one)
function buildParentMap(): Map<MatchId, { parentId: MatchId; side: 'home' | 'away' }[]> {
  const map = new Map<MatchId, { parentId: MatchId; side: 'home' | 'away' }[]>()
  for (const [parentId, children] of Object.entries(BRACKET_TREE)) {
    const [homeChildId, awayChildId] = children as [string, string]
    if (!map.has(homeChildId as MatchId)) map.set(homeChildId as MatchId, [])
    if (!map.has(awayChildId as MatchId)) map.set(awayChildId as MatchId, [])
    map.get(homeChildId as MatchId)!.push({ parentId: parentId as MatchId, side: 'home' })
    map.get(awayChildId as MatchId)!.push({ parentId: parentId as MatchId, side: 'away' })
  }
  return map
}

// Build a map of matchId → childMatchIds (matches that feed into this one)
function buildChildrenMap(): Map<MatchId, [MatchId, MatchId]> {
  const map = new Map<MatchId, [MatchId, MatchId]>()
  for (const [parentId, children] of Object.entries(BRACKET_TREE)) {
    map.set(parentId as MatchId, children as [MatchId, MatchId])
  }
  return map
}

const PARENT_MAP = buildParentMap()
const CHILDREN_MAP = buildChildrenMap()

// Collect all matches downstream of a given match (all rounds that depend on it)
function getDownstreamMatches(matchId: MatchId): MatchId[] {
  const result: MatchId[] = []
  const parents = PARENT_MAP.get(matchId) ?? []
  for (const { parentId } of parents) {
    result.push(parentId)
    result.push(...getDownstreamMatches(parentId))
  }
  return [...new Set(result)]
}

// Get the path from a match back to R32 (all ancestor match IDs)
function getAncestorPath(matchId: MatchId, side: 'home' | 'away'): MatchId[] {
  const children = CHILDREN_MAP.get(matchId)
  if (!children) return []
  const childId = side === 'home' ? children[0] : children[1]
  // Determine which side of the child the winner would come from (always "home" for simplicity)
  return [childId, ...getAncestorPath(childId, 'home')]
}

export function createBracketStore(): StoreApi<BracketStore> {
  return create<BracketStore>((set, get) => ({
    ...EMPTY_STATE,
    groups: { ...EMPTY_STATE.groups },
    matches: { ...EMPTY_STATE.matches },

    setGroupFirst: (group, teamId) =>
      set(s => ({
        groups: {
          ...s.groups,
          [group]: {
            ...s.groups[group],
            first: teamId,
            second: teamId === null ? null : s.groups[group].second,
          },
        },
      })),

    setGroupSecond: (group, teamId) =>
      set(s => ({
        groups: { ...s.groups, [group]: { ...s.groups[group], second: teamId } },
      })),

    setThirdRank: (group, rank) =>
      set(s => ({
        groups: { ...s.groups, [group]: { ...s.groups[group], thirdRank: rank } },
      })),

    setMatchWinner: (matchId, teamId) =>
      set(s => ({
        matches: { ...s.matches, [matchId]: { winner: teamId } },
      })),

    backfillPath: (matchId, teamId, side) => {
      // Set the winner at this match, then back-fill the winner through all ancestor matches
      const ancestors = getAncestorPath(matchId, side)
      set(s => {
        const matches = { ...s.matches }
        matches[matchId] = { winner: teamId }
        for (const ancestorId of ancestors) {
          matches[ancestorId] = { winner: teamId }
        }
        return { matches }
      })
    },

    clearDownstream: (matchId) => {
      const downstream = getDownstreamMatches(matchId)
      set(s => {
        const matches = { ...s.matches }
        for (const id of downstream) {
          matches[id] = { winner: null }
        }
        return { matches }
      })
    },

    loadState: (state) => set(() => ({
      groups: state.groups,
      matches: state.matches,
    })),
  }))
}

// Singleton store for the app
export const bracketStore = createBracketStore()
export const useBracketStore = bracketStore
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- bracketStore.test.ts
```
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/store/bracketStore.ts app/store/bracketStore.test.ts
git commit -m "feat: add Zustand bracket store with backfill and downstream clear"
```

---

## Task 6: Eligible Teams Selector

**Files:**
- Create: `app/lib/eligible.ts`
- Create: `app/lib/eligible.test.ts`

Purpose: given a `matchId` and the current `BracketState`, return the list of teams that are still alive and could reach that slot.

- [ ] **Step 1: Write failing tests**

Create `app/lib/eligible.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { getEligibleTeams } from './eligible'
import { EMPTY_STATE } from './encoding'
import type { BracketState } from '../store/types'

describe('getEligibleTeams', () => {
  it('returns teams from the two seeded groups for an r32 slot', () => {
    const teams = getEligibleTeams('r32_m1', EMPTY_STATE)
    // r32_m1: winner of Group A vs runner of Group B
    const ids = teams.map(t => t.id)
    expect(ids).toContain('USA')  // Group A team
    expect(ids).toContain('ARG')  // Group B team
    expect(ids.length).toBe(6)    // 3 per group × 2 groups
  })

  it('excludes eliminated teams', () => {
    const state: BracketState = {
      ...EMPTY_STATE,
      matches: {
        ...EMPTY_STATE.matches,
        r32_m3: { winner: 'ESP' }, // Spain won r32_m3 — the other team is eliminated
      },
    }
    // r16_m1 feeds from r32_m1 and r32_m2 — not r32_m3
    // so teams from r32_m3's loser should not appear in r16_m2
    const teams = getEligibleTeams('r16_m2', state)
    const ids = teams.map(t => t.id)
    // The loser of r32_m3 should be excluded from r16_m2
    expect(ids).not.toContain('BRA') // assume BRA was the other team in r32_m3 vs ESP
  })

  it('returns all bracket-half teams for the final slot', () => {
    const leftTeams = getEligibleTeams('final', EMPTY_STATE)
    expect(leftTeams.length).toBeGreaterThan(10)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- eligible.test.ts
```

- [ ] **Step 3: Implement eligible teams**

Create `app/lib/eligible.ts`:
```ts
import { TEAMS, R32_FIXTURES, BRACKET_TREE, getGroup } from '../data/teams'
import type { MatchId } from '../data/teams'
import type { BracketState } from '../store/types'
import type { Team } from '../data/teams'

// Collect all R32 match IDs that are ancestors of a given match
function getR32Ancestors(matchId: MatchId): MatchId[] {
  if (matchId.startsWith('r32')) return [matchId]
  const children = (BRACKET_TREE as Record<string, [string, string]>)[matchId]
  if (!children) return []
  return [
    ...getR32Ancestors(children[0] as MatchId),
    ...getR32Ancestors(children[1] as MatchId),
  ]
}

// Get all teams that are seeded into a given R32 match
function getR32SeedPool(r32Id: MatchId): Team[] {
  const fixture = R32_FIXTURES.find(f => f.id === r32Id)
  if (!fixture) return []
  const homeTeams = getGroup(fixture.home.group)
  const awayTeams = getGroup(fixture.away.group)
  return [...homeTeams, ...awayTeams]
}

// Get all team IDs that have been knocked out (lost a match with a known winner)
function getEliminatedTeams(state: BracketState): Set<string> {
  const eliminated = new Set<string>()
  for (const [matchId, pick] of Object.entries(state.matches)) {
    if (!pick.winner) continue
    // Find the teams in this match's seed pool and mark the loser
    const r32Ancestors = getR32Ancestors(matchId as MatchId)
    const pool = r32Ancestors.flatMap(getR32SeedPool)
    for (const team of pool) {
      if (team.id !== pick.winner) {
        // A team in the pool that isn't the winner *might* be eliminated
        // Only mark as eliminated if they were explicitly placed in a previous round
        // and lost. We approximate: if a winner is set for a match, teams in that
        // match's pool that are not the winner and have been explicitly placed are out.
      }
    }
    // Simpler: any team that won a match can't be the loser of that match.
    // Collect explicit losers by checking if a team won a lower round but
    // isn't the winner of this match.
  }

  // A team is eliminated if any match records a winner
  // that is a DIFFERENT team from the same R32 seed pool, and that match
  // is on the same bracket path as the team.
  for (const [matchId, pick] of Object.entries(state.matches)) {
    if (!pick.winner) continue
    const r32s = getR32Ancestors(matchId as MatchId)
    const pool = r32s.flatMap(getR32SeedPool).map(t => t.id)
    // Teams in this pool that aren't the winner are potentially eliminated
    // They are eliminated if: this match's round is >= the round they could first appear
    for (const teamId of pool) {
      if (teamId !== pick.winner) {
        // Mark as eliminated — a different team won a match on their path
        eliminated.add(teamId)
      }
    }
    // But winner should not be marked eliminated
    eliminated.delete(pick.winner)
  }

  return eliminated
}

export function getEligibleTeams(matchId: MatchId, state: BracketState): Team[] {
  const r32Ancestors = getR32Ancestors(matchId)
  const pool = r32Ancestors.flatMap(getR32SeedPool)
  const seen = new Set<string>()
  const uniquePool = pool.filter(t => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })

  const eliminated = getEliminatedTeams(state)
  return uniquePool.filter(t => !eliminated.has(t.id))
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- eligible.test.ts
```
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/lib/eligible.ts app/lib/eligible.test.ts
git commit -m "feat: add eligible teams selector with elimination filtering"
```

---

## Task 7: Persistence Hook

**Files:**
- Create: `app/hooks/usePersistence.ts`

- [ ] **Step 1: Implement the hook**

Create `app/hooks/usePersistence.ts`:
```ts
import { useEffect } from 'react'
import { useRouter, useSearch } from '@tanstack/react-router'
import { bracketStore } from '../store/bracketStore'
import { encodePicks, decodePicks, EMPTY_STATE } from '../lib/encoding'

const LS_KEY = 'wc2026_picks'

// Call once at app startup to hydrate from URL or localStorage
export function useHydrate() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlParam = params.get('p')
    if (urlParam) {
      const state = decodePicks(urlParam)
      if (state) {
        bracketStore.getState().loadState(state)
        return
      }
    }
    const stored = localStorage.getItem(LS_KEY)
    if (stored) {
      const state = decodePicks(stored)
      if (state) bracketStore.getState().loadState(state)
    }
  }, [])
}

// Call once to set up auto-save on every store change
export function usePersist() {
  useEffect(() => {
    return bracketStore.subscribe((state) => {
      const encoded = encodePicks(state)
      localStorage.setItem(LS_KEY, encoded)
      const url = new URL(window.location.href)
      url.searchParams.set('p', encoded)
      window.history.replaceState(null, '', url.toString())
    })
  }, [])
}

// Returns the current shareable URL
export function getShareableUrl(): string {
  return window.location.href
}
```

- [ ] **Step 2: Commit**

```bash
git add app/hooks/usePersistence.ts
git commit -m "feat: add persistence hook (localStorage + URL ?p= sync)"
```

---

## Task 8: App Routing + Root Layout

**Files:**
- Modify: `app/routes/__root.tsx`
- Modify: `app/routes/index.tsx`
- Create: `app/routes/predictor.tsx`

- [ ] **Step 1: Update root layout**

Edit `app/routes/__root.tsx`:
```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-gray-950 text-white">
      <Outlet />
    </div>
  ),
  head: () => ({
    meta: [
      { title: 'WC 2026 Predictor' },
      { name: 'description', content: 'Predict your 2026 FIFA World Cup bracket' },
    ],
  }),
})
```

- [ ] **Step 2: Redirect index → predictor**

Edit `app/routes/index.tsx`:
```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => { throw redirect({ to: '/predictor' }) },
})
```

- [ ] **Step 3: Create predictor route**

Create `app/routes/predictor.tsx`:
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '../components/AppShell'
import { useHydrate, usePersist } from '../hooks/usePersistence'

function PredictorPage() {
  useHydrate()
  usePersist()
  return <AppShell />
}

export const Route = createFileRoute('/predictor')({
  component: PredictorPage,
})
```

- [ ] **Step 4: Verify redirect works**

```bash
npm run dev
```
Open `http://localhost:3000` — should redirect to `/predictor`.

- [ ] **Step 5: Commit**

```bash
git add app/routes/
git commit -m "feat: add app routing with redirect and predictor route"
```

---

## Task 9: AppShell Component

**Files:**
- Create: `app/components/AppShell.tsx`

- [ ] **Step 1: Implement AppShell**

Create `app/components/AppShell.tsx`:
```tsx
import { useState } from 'react'
import { bracketStore } from '../store/bracketStore'
import { ALL_MATCH_IDS } from '../data/teams'
import { GroupGrid } from './GroupStage/GroupGrid'
import { BracketView } from './Knockout/BracketView'
import { GenerateButton } from './ImageGen/GenerateButton'
import { getShareableUrl } from '../hooks/usePersistence'
import { useStore } from 'zustand'

type Tab = 'groups' | 'knockout'

function usePlacedCount(): number {
  const matches = useStore(bracketStore, s => s.matches)
  return ALL_MATCH_IDS.filter(id => matches[id].winner !== null).length
}

export function AppShell() {
  const [tab, setTab] = useState<Tab>('groups')
  const placedCount = usePlacedCount()

  function copyLink() {
    navigator.clipboard.writeText(getShareableUrl())
      .then(() => alert('Link copied!'))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight">WC 2026 Predictor</span>
          <span className="text-sm text-gray-400">{placedCount} / 32 teams placed</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="text-sm px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600"
          >
            Copy link
          </button>
          <GenerateButton />
        </div>
      </header>

      <nav className="flex border-b border-gray-800 bg-gray-900">
        {(['groups', 'knockout'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? 'border-b-2 border-green-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'groups' ? 'Group Stage' : 'Knockout'}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-auto p-4">
        {tab === 'groups' ? <GroupGrid /> : <BracketView />}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/AppShell.tsx
git commit -m "feat: add AppShell with tabs and progress indicator"
```

---

## Task 10: GroupCard Component

**Files:**
- Create: `app/components/GroupStage/GroupCard.tsx`
- Create: `app/components/GroupStage/GroupCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `app/components/GroupStage/GroupCard.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GroupCard } from './GroupCard'
import { bracketStore } from '../../store/bracketStore'
import { EMPTY_STATE } from '../../lib/encoding'

beforeEach(() => {
  bracketStore.getState().loadState(EMPTY_STATE)
})

describe('GroupCard', () => {
  it('renders group label and 3 teams', () => {
    render(<GroupCard groupKey="A" />)
    expect(screen.getByText('Group A')).toBeInTheDocument()
    expect(screen.getByText('United States')).toBeInTheDocument()
    expect(screen.getByText('Panama')).toBeInTheDocument()
  })

  it('clicking a team sets first pick', () => {
    render(<GroupCard groupKey="A" />)
    fireEvent.click(screen.getByText('United States'))
    expect(bracketStore.getState().groups.A.first).toBe('USA')
  })

  it('clicking the same team twice deselects it', () => {
    render(<GroupCard groupKey="A" />)
    fireEvent.click(screen.getByText('United States'))
    fireEvent.click(screen.getByText('United States'))
    expect(bracketStore.getState().groups.A.first).toBeNull()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- GroupCard.test.tsx
```

- [ ] **Step 3: Implement GroupCard**

Create `app/components/GroupStage/GroupCard.tsx`:
```tsx
import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { getGroup } from '../../data/teams'
import type { GroupKey } from '../../data/teams'

interface Props { groupKey: GroupKey }

export function GroupCard({ groupKey }: Props) {
  const teams = getGroup(groupKey)
  const pick = useStore(bracketStore, s => s.groups[groupKey])
  const { setGroupFirst, setGroupSecond, setThirdRank } = bracketStore.getState()

  function handleTeamClick(teamId: string) {
    if (pick.first === teamId) {
      setGroupFirst(groupKey, null)
      return
    }
    if (pick.second === teamId) {
      setGroupSecond(groupKey, null)
      return
    }
    if (!pick.first) {
      setGroupFirst(groupKey, teamId)
    } else if (!pick.second && pick.first !== teamId) {
      setGroupSecond(groupKey, teamId)
    } else {
      // Replace first pick
      setGroupFirst(groupKey, teamId)
    }
  }

  const isComplete = pick.first !== null && pick.second !== null

  return (
    <div className={`rounded-lg border p-4 ${isComplete ? 'border-green-700 bg-gray-800' : 'border-gray-700 bg-gray-900'}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm">Group {groupKey}</h3>
        {isComplete && <span className="text-xs text-green-400">✓</span>}
      </div>

      <div className="space-y-2 mb-3">
        {teams.map(team => {
          const isFirst = pick.first === team.id
          const isSecond = pick.second === team.id
          return (
            <button
              key={team.id}
              onClick={() => handleTeamClick(team.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                isFirst ? 'bg-yellow-600 text-white' :
                isSecond ? 'bg-blue-700 text-white' :
                'bg-gray-800 hover:bg-gray-700 text-gray-200'
              }`}
            >
              <span>{team.flag}</span>
              <span className="flex-1 text-left">{team.name}</span>
              {isFirst && <span className="text-xs opacity-75">1st</span>}
              {isSecond && <span className="text-xs opacity-75">2nd</span>}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <label htmlFor={`rank-${groupKey}`}>3rd rank:</label>
        <select
          id={`rank-${groupKey}`}
          value={pick.thirdRank ?? ''}
          onChange={e => setThirdRank(groupKey, e.target.value ? Number(e.target.value) : null)}
          className="bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-gray-300"
        >
          <option value="">—</option>
          {Array.from({ length: 16 }, (_, i) => i + 1).map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- GroupCard.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add app/components/GroupStage/GroupCard.tsx app/components/GroupStage/GroupCard.test.tsx
git commit -m "feat: add GroupCard component with pick interaction"
```

---

## Task 11: GroupGrid Component

**Files:**
- Create: `app/components/GroupStage/GroupGrid.tsx`

- [ ] **Step 1: Implement GroupGrid**

Create `app/components/GroupStage/GroupGrid.tsx`:
```tsx
import { GROUPS } from '../../data/teams'
import { GroupCard } from './GroupCard'

export function GroupGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
      {GROUPS.map(g => (
        <GroupCard key={g} groupKey={g} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/GroupStage/GroupGrid.tsx
git commit -m "feat: add GroupGrid responsive layout"
```

---

## Task 12: MatchSlot Component

**Files:**
- Create: `app/components/Knockout/MatchSlot.tsx`

- [ ] **Step 1: Implement MatchSlot**

Create `app/components/Knockout/MatchSlot.tsx`:
```tsx
import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { getTeamById } from '../../data/teams'
import type { MatchId } from '../../data/teams'

interface Props {
  matchId: MatchId
  onSlotClick: (matchId: MatchId) => void
}

export function MatchSlot({ matchId, onSlotClick }: Props) {
  const match = useStore(bracketStore, s => s.matches[matchId])
  const winner = match.winner ? getTeamById(match.winner) : null

  return (
    <button
      onClick={() => onSlotClick(matchId)}
      className={`
        group flex items-center gap-2 px-3 py-2 rounded border text-sm w-40 transition-all
        ${winner
          ? 'border-green-600 bg-gray-800 text-white hover:border-green-400'
          : 'border-gray-700 bg-gray-900 text-gray-500 hover:border-gray-500 hover:text-gray-300'}
      `}
    >
      {winner ? (
        <>
          <span>{winner.flag}</span>
          <span className="truncate">{winner.name}</span>
        </>
      ) : (
        <span className="italic">TBD</span>
      )}
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/Knockout/MatchSlot.tsx
git commit -m "feat: add MatchSlot component"
```

---

## Task 13: TeamPicker Modal

**Files:**
- Create: `app/components/Knockout/TeamPicker.tsx`

- [ ] **Step 1: Implement TeamPicker**

Create `app/components/Knockout/TeamPicker.tsx`:
```tsx
import { getEligibleTeams } from '../../lib/eligible'
import { bracketStore } from '../../store/bracketStore'
import type { MatchId } from '../../data/teams'
import type { Team } from '../../data/teams'

interface Props {
  matchId: MatchId
  onSelect: (team: Team) => void
  onClose: () => void
}

export function TeamPicker({ matchId, onSelect, onClose }: Props) {
  const state = bracketStore.getState()
  const eligible = getEligibleTeams(matchId, state)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl p-4 w-80 max-h-[70vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Select team</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none">×</button>
        </div>
        {eligible.length === 0 ? (
          <p className="text-gray-400 text-sm">No eligible teams yet. Complete the Group Stage first.</p>
        ) : (
          <ul className="space-y-1">
            {eligible.map(team => (
              <li key={team.id}>
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 text-left transition-colors"
                  onClick={() => onSelect(team)}
                >
                  <span className="text-xl">{team.flag}</span>
                  <span>{team.name}</span>
                  <span className="ml-auto text-xs text-gray-500">Group {team.group}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/Knockout/TeamPicker.tsx
git commit -m "feat: add TeamPicker modal with eligible team list"
```

---

## Task 14: GroupPositionModal

**Files:**
- Create: `app/components/Knockout/GroupPositionModal.tsx`

Purpose: when a user picks a team at a knockout round, if their group position (1st/2nd) is unknown, ask them before anchoring.

- [ ] **Step 1: Implement GroupPositionModal**

Create `app/components/Knockout/GroupPositionModal.tsx`:
```tsx
import type { Team } from '../../data/teams'

interface Props {
  team: Team
  onSelect: (position: 'first' | 'second') => void
  onClose: () => void
}

export function GroupPositionModal({ team, onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-72 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-sm text-gray-300 mb-4">
          How did <span className="font-bold text-white">{team.flag} {team.name}</span> finish in Group {team.group}?
        </p>
        <div className="flex gap-3">
          <button
            className="flex-1 py-2 rounded bg-yellow-600 hover:bg-yellow-500 font-semibold text-sm"
            onClick={() => onSelect('first')}
          >
            1st place
          </button>
          <button
            className="flex-1 py-2 rounded bg-blue-700 hover:bg-blue-600 font-semibold text-sm"
            onClick={() => onSelect('second')}
          >
            2nd place
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/Knockout/GroupPositionModal.tsx
git commit -m "feat: add GroupPositionModal for anchoring team to group position"
```

---

## Task 15: BracketView Layout

**Files:**
- Create: `app/components/Knockout/BracketView.tsx`

This is the main knockout UI. It wires up MatchSlot, TeamPicker, and GroupPositionModal.

- [ ] **Step 1: Implement BracketView**

Create `app/components/Knockout/BracketView.tsx`:
```tsx
import { useState } from 'react'
import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { MatchSlot } from './MatchSlot'
import { TeamPicker } from './TeamPicker'
import { GroupPositionModal } from './GroupPositionModal'
import { getTeamById } from '../../data/teams'
import type { MatchId } from '../../data/teams'
import type { Team } from '../../data/teams'

type PickingState =
  | { phase: 'idle' }
  | { phase: 'picking'; matchId: MatchId }
  | { phase: 'position'; matchId: MatchId; team: Team }

// Bracket column order left → centre, right → centre
const LEFT_ROUNDS: MatchId[][] = [
  ['r32_m1','r32_m2','r32_m3','r32_m4','r32_m5','r32_m6','r32_m7','r32_m8'],
  ['r16_m1','r16_m2','r16_m3','r16_m4'],
  ['qf_m1','qf_m2'],
  ['sf_m1'],
]
const RIGHT_ROUNDS: MatchId[][] = [
  ['r32_m9','r32_m10','r32_m11','r32_m12','r32_m13','r32_m14','r32_m15','r32_m16'],
  ['r16_m5','r16_m6','r16_m7','r16_m8'],
  ['qf_m3','qf_m4'],
  ['sf_m2'],
]

function RoundColumn({ matchIds, onSlotClick }: { matchIds: MatchId[]; onSlotClick: (id: MatchId) => void }) {
  return (
    <div className="flex flex-col justify-around gap-2 min-w-[160px]">
      {matchIds.map(id => (
        <MatchSlot key={id} matchId={id} onSlotClick={onSlotClick} />
      ))}
    </div>
  )
}

export function BracketView() {
  const [picking, setPicking] = useState<PickingState>({ phase: 'idle' })
  const finalWinner = useStore(bracketStore, s => s.matches.final.winner)
  const champion = finalWinner ? getTeamById(finalWinner) : null

  function handleSlotClick(matchId: MatchId) {
    setPicking({ phase: 'picking', matchId })
  }

  function handleTeamSelect(team: Team) {
    if (picking.phase !== 'picking') return
    const { matchId } = picking
    const groupPick = bracketStore.getState().groups[team.group as keyof typeof bracketStore.getState().groups]
    const positionKnown = groupPick.first === team.id || groupPick.second === team.id

    if (!positionKnown) {
      setPicking({ phase: 'position', matchId, team })
      return
    }
    commitPick(matchId, team)
  }

  function handlePositionSelect(position: 'first' | 'second') {
    if (picking.phase !== 'position') return
    const { matchId, team } = picking
    const { setGroupFirst, setGroupSecond } = bracketStore.getState()
    if (position === 'first') setGroupFirst(team.group as any, team.id)
    else setGroupSecond(team.group as any, team.id)
    commitPick(matchId, team)
  }

  function commitPick(matchId: MatchId, team: Team) {
    bracketStore.getState().clearDownstream(matchId)
    bracketStore.getState().backfillPath(matchId, team.id, 'home')
    setPicking({ phase: 'idle' })
  }

  return (
    <div className="overflow-x-auto pb-8">
      <div className="flex items-center gap-4 min-w-max mx-auto px-4">
        {/* Left half: R32 → SF */}
        {LEFT_ROUNDS.map((ids, i) => (
          <RoundColumn key={i} matchIds={ids} onSlotClick={handleSlotClick} />
        ))}

        {/* Champion */}
        <div className="flex flex-col items-center gap-2 px-4">
          <div className="text-xs text-gray-400 mb-1">Champion</div>
          <div className="w-36 h-16 rounded-xl border-2 border-yellow-500 bg-gray-800 flex items-center justify-center">
            {champion ? (
              <span className="text-lg font-bold">{champion.flag} {champion.name}</span>
            ) : (
              <span className="text-gray-500 text-sm italic">TBD</span>
            )}
          </div>
          <MatchSlot matchId="final" onSlotClick={handleSlotClick} />
        </div>

        {/* Right half: SF → R32 */}
        {[...RIGHT_ROUNDS].reverse().map((ids, i) => (
          <RoundColumn key={i} matchIds={ids} onSlotClick={handleSlotClick} />
        ))}
      </div>

      {/* 3rd place */}
      <div className="mt-8 flex justify-center gap-4 items-center">
        <span className="text-xs text-gray-400">3rd Place</span>
        <MatchSlot matchId="third_place" onSlotClick={handleSlotClick} />
      </div>

      {picking.phase === 'picking' && (
        <TeamPicker
          matchId={picking.matchId}
          onSelect={handleTeamSelect}
          onClose={() => setPicking({ phase: 'idle' })}
        />
      )}
      {picking.phase === 'position' && (
        <GroupPositionModal
          team={picking.team}
          onSelect={handlePositionSelect}
          onClose={() => setPicking({ phase: 'idle' })}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/Knockout/BracketView.tsx
git commit -m "feat: add BracketView with pathway selection and modals"
```

---

## Task 16: BracketCanvas (Image Generation)

**Files:**
- Create: `app/components/ImageGen/BracketCanvas.tsx`

A hidden, fixed-size div that mirrors the bracket state for html2canvas capture.

- [ ] **Step 1: Implement BracketCanvas**

Create `app/components/ImageGen/BracketCanvas.tsx`:
```tsx
import { forwardRef } from 'react'
import { ALL_MATCH_IDS, getTeamById } from '../../data/teams'
import { bracketStore } from '../../store/bracketStore'
import type { MatchId } from '../../data/teams'

const ROUND_ORDER: MatchId[][] = [
  ['r32_m1','r32_m2','r32_m3','r32_m4','r32_m5','r32_m6','r32_m7','r32_m8'],
  ['r16_m1','r16_m2','r16_m3','r16_m4'],
  ['qf_m1','qf_m2'],
  ['sf_m1'],
  ['final'],
  ['sf_m2'],
  ['qf_m3','qf_m4'],
  ['r16_m5','r16_m6','r16_m7','r16_m8'],
  ['r32_m9','r32_m10','r32_m11','r32_m12','r32_m13','r32_m14','r32_m15','r32_m16'],
]

export const BracketCanvas = forwardRef<HTMLDivElement>((_, ref) => {
  const matches = bracketStore.getState().matches

  return (
    <div
      ref={ref}
      style={{ width: 1200, height: 800, position: 'fixed', top: -9999, left: -9999, background: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, padding: 16 }}
    >
      {ROUND_ORDER.map((ids, col) => (
        <div key={col} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: '100%', gap: 4, minWidth: 110 }}>
          {ids.map(id => {
            const winner = matches[id].winner ? getTeamById(matches[id].winner!) : null
            return (
              <div key={id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '6px 8px', fontSize: 11, color: winner ? '#fff' : '#475569', whiteSpace: 'nowrap' }}>
                {winner ? `${winner.flag} ${winner.name}` : 'TBD'}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
})
BracketCanvas.displayName = 'BracketCanvas'
```

- [ ] **Step 2: Commit**

```bash
git add app/components/ImageGen/BracketCanvas.tsx
git commit -m "feat: add BracketCanvas for image capture"
```

---

## Task 17: WinnerCard (Image Generation)

**Files:**
- Create: `app/components/ImageGen/WinnerCard.tsx`

- [ ] **Step 1: Implement WinnerCard**

Create `app/components/ImageGen/WinnerCard.tsx`:
```tsx
import { forwardRef } from 'react'
import { bracketStore } from '../../store/bracketStore'
import { getTeamById } from '../../data/teams'

export const WinnerCard = forwardRef<HTMLDivElement>((_, ref) => {
  const { matches } = bracketStore.getState()
  const champion = matches.final.winner ? getTeamById(matches.final.winner) : null
  const runnerUp = matches.sf_m1.winner && matches.sf_m1.winner !== matches.final.winner
    ? getTeamById(matches.sf_m1.winner)
    : matches.sf_m2.winner && matches.sf_m2.winner !== matches.final.winner
      ? getTeamById(matches.sf_m2.winner)
      : null
  const third = matches.third_place.winner ? getTeamById(matches.third_place.winner) : null

  const podium = [
    { place: '🥇', label: 'Champion', team: champion },
    { place: '🥈', label: 'Runner-up', team: runnerUp },
    { place: '🥉', label: '3rd Place', team: third },
  ]

  return (
    <div
      ref={ref}
      style={{ width: 800, height: 450, position: 'fixed', top: -9999, left: -9999, background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 40 }}
    >
      <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: 0 }}>⚽ FIFA World Cup 2026</h1>
      <div style={{ display: 'flex', gap: 32 }}>
        {podium.map(({ place, label, team }) => (
          <div key={label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '16px 24px', minWidth: 180 }}>
            <div style={{ fontSize: 36 }}>{place}</div>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>{label}</div>
            {team ? (
              <>
                <div style={{ fontSize: 40, marginTop: 8 }}>{team.flag}</div>
                <div style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginTop: 4 }}>{team.name}</div>
              </>
            ) : (
              <div style={{ color: '#475569', fontSize: 14, marginTop: 12 }}>TBD</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
})
WinnerCard.displayName = 'WinnerCard'
```

- [ ] **Step 2: Commit**

```bash
git add app/components/ImageGen/WinnerCard.tsx
git commit -m "feat: add WinnerCard for image capture"
```

---

## Task 18: GenerateButton (Capture + Download + Copy Link)

**Files:**
- Create: `app/components/ImageGen/GenerateButton.tsx`

- [ ] **Step 1: Implement GenerateButton**

Create `app/components/ImageGen/GenerateButton.tsx`:
```tsx
import { useRef, useState } from 'react'
import { useStore } from 'zustand'
import html2canvas from 'html2canvas'
import { bracketStore } from '../../store/bracketStore'
import { BracketCanvas } from './BracketCanvas'
import { WinnerCard } from './WinnerCard'

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export function GenerateButton() {
  const bracketRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)

  const finalWinner = useStore(bracketStore, s => s.matches.final.winner)
  const thirdPlaceWinner = useStore(bracketStore, s => s.matches.third_place.winner)
  const canGenerate = finalWinner !== null && thirdPlaceWinner !== null

  async function handleGenerate() {
    if (!bracketRef.current || !cardRef.current) return
    setLoading(true)
    try {
      const [bracketCanvas, cardCanvas] = await Promise.all([
        html2canvas(bracketRef.current, { backgroundColor: '#0f172a', scale: 1 }),
        html2canvas(cardRef.current, { backgroundColor: null, scale: 1 }),
      ])
      downloadCanvas(bracketCanvas, 'worldcup-2026-bracket.png')
      downloadCanvas(cardCanvas, 'worldcup-2026-winner.png')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleGenerate}
        disabled={!canGenerate || loading}
        className={`text-sm px-3 py-1.5 rounded font-medium transition-colors ${
          canGenerate
            ? 'bg-green-600 hover:bg-green-500 text-white'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? 'Generating…' : 'Generate images'}
      </button>
      <BracketCanvas ref={bracketRef} />
      <WinnerCard ref={cardRef} />
    </>
  )
}
```

- [ ] **Step 2: Verify full app works end-to-end**

```bash
npm run dev
```

Test the following manually:
- Visit `/predictor` — Group Stage tab loads with 16 group cards
- Pick 1st and 2nd in a group — card turns green, 3rd rank dropdown available
- Switch to Knockout tab — click any slot — TeamPicker opens with eligible teams
- Select a team — it back-fills through all prior rounds
- If group position unknown, GroupPositionModal appears
- After picking Final + 3rd place winner — "Generate images" button activates
- Click generate — two PNG files download
- Refresh page — picks are restored from localStorage
- Copy link — paste in new tab — picks hydrate from URL

- [ ] **Step 3: Run all tests**

```bash
npm test
```
Expected: All tests pass.

- [ ] **Step 4: Final commit**

```bash
git add app/components/ImageGen/GenerateButton.tsx
git commit -m "feat: add GenerateButton with html2canvas image download"
```

---

## Implementation Notes

- **Team data:** The `teams.ts` file contains approximate group assignments. Verify all 48 teams and R32 fixture pairings against the official FIFA draw before shipping.
- **Bracket tree:** The `BRACKET_TREE` in `teams.ts` defines which matches feed which — if the R32 pairings change, update both `R32_FIXTURES` and `BRACKET_TREE`.
- **Tailwind:** The components use Tailwind utility classes. Ensure Tailwind is configured in the TanStack Start scaffold (it usually is by default or add via `npm install -D tailwindcss`).
- **html2canvas limitations:** Cross-origin images (flag SVGs from CDN) won't render. Use emoji flags or inline SVGs.
