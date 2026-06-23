import { GROUPS, TEAMS, type GroupKey } from '../data/teams'
import { bracketStore } from '../store/bracketStore'
import { groupScoreStore } from '../store/groupScoreStore'
import { computeStandings, getGroupMatches, type TeamStanding } from './standings'
import { compareThirdPlaceStanding } from './tiebreakers'

function buildNameToId(groupKey: GroupKey, overrides: Record<string, { name: string }>): Record<string, string> {
  const nameToId: Record<string, string> = {}
  for (const team of TEAMS.filter(t => t.group === groupKey)) {
    const ov = overrides[team.id]
    if (ov) nameToId[ov.name] = team.id
  }
  return nameToId
}

function groupHasPlayedScores(
  groupKey: GroupKey,
  scores: Record<number, { home: number | null; away: number | null }>,
): boolean {
  return getGroupMatches(groupKey).some(m => {
    const s = scores[m.matchNumber]
    return s?.home != null && s?.away != null
  })
}


/** Push current group standings into bracket qualification slots (1st / 2nd / best 8×3rd). */
export function syncBracketFromStandings(): void {
  const { scores, discipline, teamConduct, overrides } = groupScoreStore.getState()

  const updates: Partial<Record<GroupKey, {
    first: string | null
    second: string | null
    third: string | null
    thirdRank: number | null
  }>> = {}

  const thirdCandidates: { group: GroupKey; standing: TeamStanding }[] = []

  for (const g of GROUPS) {
    if (!groupHasPlayedScores(g, scores)) continue

    const standings = computeStandings(
      g,
      scores,
      buildNameToId(g, overrides),
      discipline,
      teamConduct,
    )

    updates[g] = {
      first: standings[0]?.teamId ?? null,
      second: standings[1]?.teamId ?? null,
      third: null,
      thirdRank: null,
    }

    if (standings[2]) {
      thirdCandidates.push({ group: g, standing: standings[2] })
    }
  }

  thirdCandidates.sort((a, b) => compareThirdPlaceStanding(a.standing, b.standing))
  thirdCandidates.forEach((c, i) => {
    const qualifies = i < 8
    updates[c.group] = {
      ...updates[c.group]!,
      third: qualifies ? c.standing.teamId : null,
      thirdRank: i + 1,
    }
  })

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
