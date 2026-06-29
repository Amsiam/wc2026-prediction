import { GROUPS, TEAMS, type GroupKey } from '../data/teams'
import { bracketStore } from '../store/bracketStore'
import { groupScoreStore } from '../store/groupScoreStore'
import { standingsToBracketUpdates } from './standingsToBracketUpdates'

function buildNameToId(overrides: Record<string, { name: string }>): Record<string, string> {
  const nameToId: Record<string, string> = {}
  for (const g of GROUPS) {
    for (const team of TEAMS.filter(t => t.group === g)) {
      const ov = overrides[team.id]
      if (ov) nameToId[ov.name] = team.id
    }
  }
  return nameToId
}

/** Push current group standings into bracket qualification slots (1st / 2nd / best 8×3rd). */
export function syncBracketFromStandings(): void {
  const { scores, discipline, teamConduct, overrides } = groupScoreStore.getState()
  const updates = standingsToBracketUpdates(
    scores,
    discipline,
    teamConduct,
    buildNameToId(overrides),
  )

  if (Object.keys(updates).length > 0) {
    bracketStore.getState().applyGroupQualifiersFromStandings(updates)
  }
}

if (typeof window !== 'undefined') {
  let scheduled = false
  const run = () => {
    scheduled = false
    syncBracketFromStandings()
  }

  groupScoreStore.subscribe((state, prev) => {
    if (
      state.scores === prev.scores &&
      state.discipline === prev.discipline &&
      state.teamConduct === prev.teamConduct
    ) return
    if (!scheduled) {
      scheduled = true
      queueMicrotask(run)
    }
  })

  queueMicrotask(run)
}
