import { GROUPS, TEAMS, type GroupKey } from '../data/teams'
import { computeBracketQualifiers } from './computeBracketQualifiers'
import { getGroupMatches } from './standings'
import type { GroupDiscipline, GroupScores } from './standings'

function groupHasPlayedScores(groupKey: GroupKey, scores: GroupScores): boolean {
  return getGroupMatches(groupKey).some(m => {
    const s = scores[m.matchNumber]
    return s?.home != null && s?.away != null
  })
}

/** Build bracket-store updates from scores (partial groups allowed). */
export function standingsToBracketUpdates(
  scores: GroupScores,
  discipline: GroupDiscipline = {},
  teamConduct: Record<string, number> = {},
  nameToId: Record<string, string> = {},
) {
  const { groups, thirdRanks } = computeBracketQualifiers(
    scores,
    discipline,
    teamConduct,
    { completeOnly: false, nameToId },
  )

  const updates: Partial<Record<GroupKey, {
    first: string | null
    second: string | null
    third: string | null
    thirdRank: number | null
  }>> = {}

  for (const g of GROUPS) {
    if (!groupHasPlayedScores(g, scores)) continue
    const pick = groups[g]
    if (!pick) continue
    updates[g] = {
      first: pick.first ?? null,
      second: pick.second ?? null,
      third: pick.third ?? null,
      thirdRank: thirdRanks[g] ?? null,
    }
  }

  return updates
}
