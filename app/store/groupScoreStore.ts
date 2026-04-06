import { createStore } from 'zustand/vanilla'
import { CONFIRMED_SCORES, isScoreLocked } from '../data/confirmed'

export interface MatchScore {
  home: number | null
  away: number | null
}

/** Override for a placeholder team: maps teamId → real { name, flagCode } */
export interface TeamOverride {
  name: string
  flagCode: string
}

interface GroupScoreState {
  scores: Record<number, MatchScore>         // matchNumber → score
  overrides: Record<string, TeamOverride>    // teamId → real team info
  activeGroupModal: string | null            // which group's score modal is open
}

interface GroupScoreActions {
  setScore: (matchNumber: number, home: number | null, away: number | null) => void
  clearGroupScores: (matchNumbers: number[]) => void
  setOverride: (teamId: string, override: TeamOverride | null) => void
  setActiveGroupModal: (group: string | null) => void
}

const STORAGE_KEY = 'wc2026_scores'

function loadFromStorage(): Partial<GroupScoreState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return {
      scores:    typeof parsed.scores    === 'object' ? parsed.scores    : {},
      overrides: typeof parsed.overrides === 'object' ? parsed.overrides : {},
    }
  } catch {
    return {}
  }
}

// Merge confirmed scores on top of persisted scores
function mergeConfirmed(scores: Record<number, MatchScore>): Record<number, MatchScore> {
  return { ...scores, ...CONFIRMED_SCORES }
}

export const groupScoreStore = createStore<GroupScoreState & GroupScoreActions>((set) => {
  const persisted = loadFromStorage()
  return {
    scores: mergeConfirmed(persisted.scores ?? {}),
    overrides: persisted.overrides ?? {},
    activeGroupModal: null,

    setScore: (matchNumber, home, away) => {
      if (isScoreLocked(matchNumber)) return
      set(s => ({ scores: { ...s.scores, [matchNumber]: { home, away } } }))
    },

    clearGroupScores: (matchNumbers) =>
      set(s => {
        const scores = { ...s.scores }
        for (const n of matchNumbers) delete scores[n]
        // Re-apply confirmed scores so they can't be wiped
        for (const n of matchNumbers) {
          if (CONFIRMED_SCORES[n]) scores[n] = CONFIRMED_SCORES[n]
        }
        return { scores }
      }),

    setOverride: (teamId, override) =>
      set(s => {
        if (override === null) {
          const { [teamId]: _, ...rest } = s.overrides
          return { overrides: rest }
        }
        return { overrides: { ...s.overrides, [teamId]: override } }
      }),

    setActiveGroupModal: (group) => set({ activeGroupModal: group }),
  }
})

// Persist to localStorage on every change (client-side only)
if (typeof window !== 'undefined') {
  groupScoreStore.subscribe(state => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        scores:    state.scores,
        overrides: state.overrides,
      }))
    } catch {}
  })
}
