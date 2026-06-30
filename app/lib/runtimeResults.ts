import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { CONFIRMED_MATCHES } from '../data/confirmed'
import { LIVE_RESULTS } from '../data/liveResults'
import type { MatchId } from '../data/teams'
import type { MatchResult } from './matchScore'
import type { MatchScore } from '../store/groupScoreStore'
import { groupScoreStore } from '../store/groupScoreStore'

interface RuntimeResultsState {
  knockout: Partial<Record<MatchId, string>>
  scores: Record<number, MatchResult>
}

/** Latest results from in-browser sync (merged over bundled liveResults). */
export const runtimeResultsStore = createStore<RuntimeResultsState>(() => ({
  knockout: {},
  scores: {},
}))

export function officialKnockoutWinner(matchId: MatchId): string | undefined {
  return CONFIRMED_MATCHES[matchId]
    ?? runtimeResultsStore.getState().knockout[matchId]
    ?? LIVE_RESULTS.knockout[matchId]
}

export function isKnockoutResultLocked(matchId: MatchId): boolean {
  return officialKnockoutWinner(matchId) !== undefined
}

export function officialMatchResult(
  matchNumber: number,
  storeScores?: Record<number, MatchScore>,
): MatchResult | undefined {
  const runtime = runtimeResultsStore.getState().scores[matchNumber]
  if (runtime) return runtime

  const fromStore = storeScores?.[matchNumber]
  if (fromStore?.home != null && fromStore?.away != null) {
    return {
      home: fromStore.home,
      away: fromStore.away,
      ...(fromStore.pens ? { pens: fromStore.pens } : {}),
    }
  }

  return LIVE_RESULTS.scores[matchNumber]
}

export function useOfficialKnockoutWinner(matchId: MatchId): string | undefined {
  const runtime = useStore(runtimeResultsStore, s => s.knockout[matchId])
  return CONFIRMED_MATCHES[matchId] ?? runtime ?? LIVE_RESULTS.knockout[matchId]
}

export function useOfficialMatchResult(matchNumber: number): MatchResult | undefined {
  const runtime = useStore(runtimeResultsStore, s => s.scores[matchNumber])
  const storeScores = useStore(groupScoreStore, s => s.scores)
  if (matchNumber < 0) return undefined
  if (runtime) return runtime
  return officialMatchResult(matchNumber, storeScores)
}
