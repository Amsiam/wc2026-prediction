import { createStore } from 'zustand/vanilla'
import { EMPTY_STATE } from '../lib/encoding'
import { BRACKET_TREE } from '../data/teams'
import type { BracketState, TeamId } from './types'
import type { GroupKey, MatchId } from '../data/teams'

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

// Map: matchId → list of parent matches that contain this match as a child
function buildParentMap(): Map<MatchId, MatchId[]> {
  const map = new Map<MatchId, MatchId[]>()
  for (const [parentId, children] of Object.entries(BRACKET_TREE) as unknown as [MatchId, [MatchId, MatchId]][]) {
    for (const childId of children) {
      const existing = map.get(childId) ?? []
      existing.push(parentId)
      map.set(childId, existing)
    }
  }
  return map
}

// Map: matchId → [homeChildId, awayChildId]
function buildChildrenMap(): Map<MatchId, [MatchId, MatchId]> {
  const map = new Map<MatchId, [MatchId, MatchId]>()
  for (const [parentId, children] of Object.entries(BRACKET_TREE) as unknown as [MatchId, [MatchId, MatchId]][]) {
    map.set(parentId, children)
  }
  return map
}

const PARENT_MAP = buildParentMap()
const CHILDREN_MAP = buildChildrenMap()

// All matches downstream of matchId (ancestors in the bracket, i.e., later rounds)
function getDownstreamMatches(matchId: MatchId): MatchId[] {
  const result = new Set<MatchId>()
  const parents = PARENT_MAP.get(matchId) ?? []
  for (const parentId of parents) {
    result.add(parentId)
    for (const id of getDownstreamMatches(parentId)) result.add(id)
  }
  return [...result]
}

// Get the chain of ancestor match IDs going upstream from matchId on a given side
// Returns the matchIds that would be auto-filled when picking a winner at matchId
function getAncestorChain(matchId: MatchId, side: 'home' | 'away'): MatchId[] {
  const children = CHILDREN_MAP.get(matchId)
  if (!children) return []
  const childId = side === 'home' ? children[0] : children[1]
  // Recursively follow 'home' side going upstream
  return [childId, ...getAncestorChain(childId, 'home')]
}

function makeEmptyState(): BracketState {
  return {
    groups: { ...EMPTY_STATE.groups },
    matches: { ...EMPTY_STATE.matches },
  }
}

export function createBracketStore() {
  return createStore<BracketStore>((set) => ({
    ...makeEmptyState(),

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
      const ancestors = getAncestorChain(matchId, side)
      set(s => {
        const matches = { ...s.matches }
        matches[matchId] = { winner: teamId }
        for (const id of ancestors) {
          matches[id] = { winner: teamId }
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

    loadState: (state) =>
      set(() => ({
        groups: state.groups,
        matches: state.matches,
      })),
  }))
}

// Singleton store for the app
export const bracketStore = createBracketStore()
