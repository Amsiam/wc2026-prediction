import { createStore } from 'zustand/vanilla'
import { CONFIRMED_DISCIPLINE, CONFIRMED_SCORES, isDisciplineLocked, isScoreLocked } from '../data/confirmed'
import { LIVE_RESULTS } from '../data/liveResults'
import type { MatchDiscipline } from '../lib/fairPlay'

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
  scores: Record<number, MatchScore>
  discipline: Record<number, MatchDiscipline>
  teamConduct: Record<string, number>
  overrides: Record<string, TeamOverride>
  activeGroupModal: string | null
}

interface GroupScoreActions {
  setScore: (matchNumber: number, home: number | null, away: number | null) => void
  setDiscipline: (matchNumber: number, discipline: MatchDiscipline) => void
  clearGroupScores: (matchNumbers: number[]) => void
  setOverride: (teamId: string, override: TeamOverride | null) => void
  setActiveGroupModal: (group: string | null) => void
  importLiveResults: (data: {
    scores?: Record<number, { home: number; away: number }>
    discipline?: Record<number, MatchDiscipline>
    teamConduct?: Record<string, number>
  }) => void
}

const STORAGE_KEY = 'wc2026_scores'

function loadFromStorage(): Partial<Pick<GroupScoreState, 'scores' | 'discipline' | 'overrides'>> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return {
      scores: typeof parsed.scores === 'object' ? parsed.scores : {},
      discipline: typeof parsed.discipline === 'object' ? parsed.discipline : {},
      overrides: typeof parsed.overrides === 'object' ? parsed.overrides : {},
    }
  } catch {
    return {}
  }
}

function mergeOfficial(
  scores: Record<number, MatchScore>,
  discipline: Record<number, MatchDiscipline>,
  teamConduct: Record<string, number>,
): { scores: Record<number, MatchScore>; discipline: Record<number, MatchDiscipline>; teamConduct: Record<string, number> } {
  const mergedScores = { ...scores }
  const mergedDiscipline = { ...discipline }
  const mergedConduct = { ...teamConduct }

  for (const [n, s] of Object.entries(LIVE_RESULTS.scores)) {
    const num = Number(n)
    mergedScores[num] = { home: s.home, away: s.away }
  }
  for (const [n, d] of Object.entries(LIVE_RESULTS.discipline)) {
    mergedDiscipline[Number(n)] = d
  }
  Object.assign(mergedConduct, LIVE_RESULTS.teamConduct)
  for (const [n, s] of Object.entries(CONFIRMED_SCORES)) {
    mergedScores[Number(n)] = { home: s.home, away: s.away }
  }
  for (const [n, d] of Object.entries(CONFIRMED_DISCIPLINE)) {
    mergedDiscipline[Number(n)] = d
  }

  return { scores: mergedScores, discipline: mergedDiscipline, teamConduct: mergedConduct }
}

export const groupScoreStore = createStore<GroupScoreState & GroupScoreActions>((set) => {
  const persisted = loadFromStorage()
  const official = mergeOfficial(persisted.scores ?? {}, persisted.discipline ?? {}, {})

  return {
    scores: official.scores,
    discipline: official.discipline,
    teamConduct: official.teamConduct,
    overrides: persisted.overrides ?? {},
    activeGroupModal: null,

    setScore: (matchNumber, home, away) => {
      if (isScoreLocked(matchNumber)) return
      set(s => ({ scores: { ...s.scores, [matchNumber]: { home, away } } }))
    },

    setDiscipline: (matchNumber, discipline) => {
      if (isDisciplineLocked(matchNumber)) return
      set(s => ({ discipline: { ...s.discipline, [matchNumber]: discipline } }))
    },

    clearGroupScores: (matchNumbers) =>
      set(s => {
        const scores = { ...s.scores }
        const discipline = { ...s.discipline }
        for (const n of matchNumbers) {
          if (!isScoreLocked(n)) delete scores[n]
          if (!isDisciplineLocked(n)) delete discipline[n]
        }
        const merged = mergeOfficial(scores, discipline, s.teamConduct)
        return merged
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

    importLiveResults: (data) =>
      set(s => {
        const scores = { ...s.scores }
        const discipline = { ...s.discipline }
        const teamConduct = { ...s.teamConduct }
        if (data.scores) {
          for (const [n, score] of Object.entries(data.scores)) {
            const num = Number(n)
            if (!isScoreLocked(num)) scores[num] = { home: score.home, away: score.away }
          }
        }
        if (data.discipline) {
          for (const [d, cards] of Object.entries(data.discipline)) {
            const num = Number(d)
            if (!isDisciplineLocked(num)) discipline[num] = cards
          }
        }
        if (data.teamConduct) Object.assign(teamConduct, data.teamConduct)
        return mergeOfficial(scores, discipline, teamConduct)
      }),
  }
})

if (typeof window !== 'undefined') {
  groupScoreStore.subscribe(state => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        scores: state.scores,
        discipline: state.discipline,
        overrides: state.overrides,
      }))
    } catch {}
  })
}
