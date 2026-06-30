import { bracketStore } from '../store/bracketStore'
import { groupScoreStore } from '../store/groupScoreStore'
import { runtimeResultsStore } from './runtimeResults'
import { syncBracketFromStandings } from './syncBracketFromStandings'
import type { MatchId } from '../data/teams'
import type { FetchedResults } from './fetchResults'

export function applyFetchedResults(data: FetchedResults): void {
  runtimeResultsStore.setState({
    knockout: data.knockout ?? {},
    scores: data.scores ?? {},
  })

  groupScoreStore.getState().importLiveResults({
    scores: data.scores,
    discipline: data.discipline,
    teamConduct: data.teamConduct,
  })

  syncBracketFromStandings()

  for (const [matchId, winner] of Object.entries(data.knockout ?? {})) {
    const id = matchId as MatchId
    bracketStore.getState().setMatchWinner(id, winner)
  }

  bracketStore.getState().applyOfficialLocks()
}

export type SyncResultsOutcome =
  | { ok: true; data: FetchedResults }
  | { ok: false; error: string }

export async function fetchAndApplyResults(): Promise<SyncResultsOutcome> {
  try {
    const res = await fetch('/api/wc-results')
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string }
      return { ok: false, error: body.error ?? `Sync failed (${res.status})` }
    }
    const data = await res.json() as FetchedResults | { error: string }
    if ('error' in data) return { ok: false, error: data.error }
    applyFetchedResults(data)
    return { ok: true, data }
  } catch {
    return { ok: false, error: 'Could not reach sync service' }
  }
}
