import { GROUPS, TEAMS, type GroupKey, type MatchId } from '../data/teams'
import { resolveThirdSlots } from '../data/thirdPlaceScenarios'
import { computeStandings, getGroupMatches, isGroupComplete, type GroupDiscipline, type GroupScores } from './standings'
import { compareThirdPlaceStanding } from './tiebreakers'

export interface ConfirmedGroupPick {
  first: string
  second: string
  third?: string
  thirdSlot?: MatchId
}

export interface BracketQualifierResult {
  groups: Partial<Record<GroupKey, ConfirmedGroupPick>>
  /** 1-based rank among all third-placed teams (for bracket store). */
  thirdRanks: Partial<Record<GroupKey, number>>
}

function buildNameToId(groupKey: GroupKey, overrides: Record<string, string> = {}): Record<string, string> {
  const nameToId: Record<string, string> = { ...overrides }
  for (const team of TEAMS.filter(t => t.group === groupKey)) {
    nameToId[team.name] = team.id
  }
  return nameToId
}

/** Official 1st / 2nd / qualifying 3rd (+ R32 slot) from final group-stage scores. */
export function computeBracketQualifiers(
  scores: GroupScores,
  discipline: GroupDiscipline = {},
  teamConduct: Record<string, number> = {},
  options: {
    completeOnly?: boolean
    nameToId?: Record<string, string>
  } = {},
): BracketQualifierResult {
  const { completeOnly = true, nameToId: globalNameToId = {} } = options
  const groups: Partial<Record<GroupKey, ConfirmedGroupPick>> = {}
  const thirdRanks: Partial<Record<GroupKey, number>> = {}
  const thirdCandidates: { group: GroupKey; teamId: string }[] = []

  for (const g of GROUPS) {
    if (completeOnly && !isGroupComplete(g, scores)) continue
    if (!completeOnly && !getGroupMatches(g).some(m => {
      const s = scores[m.matchNumber]
      return s?.home != null && s?.away != null
    })) continue

    const nameToId = buildNameToId(g, globalNameToId)
    const standings = computeStandings(g, scores, nameToId, discipline, teamConduct)
    const first = standings[0]?.teamId
    const second = standings[1]?.teamId
    if (!first || !second) continue

    groups[g] = { first, second }
    if (standings[2]) {
      thirdCandidates.push({ group: g, teamId: standings[2].teamId })
    }
  }

  thirdCandidates.sort((a, b) => {
    const nameToIdA = buildNameToId(a.group, globalNameToId)
    const nameToIdB = buildNameToId(b.group, globalNameToId)
    const sa = computeStandings(a.group, scores, nameToIdA, discipline, teamConduct)
      .find(s => s.teamId === a.teamId)!
    const sb = computeStandings(b.group, scores, nameToIdB, discipline, teamConduct)
      .find(s => s.teamId === b.teamId)!
    return compareThirdPlaceStanding(sa, sb)
  })

  const qualifying = thirdCandidates.slice(0, 8)
  const slots = qualifying.length === 8
    ? resolveThirdSlots(qualifying.map(q => q.group))
    : {}

  for (let i = 0; i < thirdCandidates.length; i++) {
    const { group, teamId } = thirdCandidates[i]
    thirdRanks[group] = i + 1
    if (i >= 8) continue
    groups[group] = {
      ...groups[group]!,
      third: teamId,
      thirdSlot: slots[group],
    }
  }

  return { groups, thirdRanks }
}
