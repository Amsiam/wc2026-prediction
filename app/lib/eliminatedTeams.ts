import { useMemo } from 'react'
import { useStore } from 'zustand'
import { CONFIRMED_GROUPS, CONFIRMED_MATCHES } from '../data/confirmed'
import { LIVE_RESULTS } from '../data/liveResults'
import { GROUPS, getGroup, type MatchId } from '../data/teams'
import { computeBracketQualifiers } from './computeBracketQualifiers'
import { resolveMatchParticipants } from './knockoutParticipants'
import { runtimeResultsStore } from './runtimeResults'
import { computeStandings, isGroupComplete, type GroupDiscipline, type GroupScores } from './standings'

function mergeKnockout(
  runtime: Partial<Record<MatchId, string>>,
): Partial<Record<MatchId, string>> {
  return {
    ...LIVE_RESULTS.knockout,
    ...CONFIRMED_MATCHES,
    ...runtime,
  }
}

/** Teams officially out of the tournament (group stage or knockout). */
export function computeEliminatedTeamIds(input: {
  scores: GroupScores
  discipline?: GroupDiscipline
  teamConduct?: Record<string, number>
  knockout?: Partial<Record<MatchId, string>>
}): Set<string> {
  const {
    scores,
    discipline = {},
    teamConduct = {},
    knockout = {},
  } = input

  const { groups, thirdRanks } = computeBracketQualifiers(
    scores,
    discipline,
    teamConduct,
    { completeOnly: true },
  )

  const eliminated = new Set<string>()

  for (const g of GROUPS) {
    if (!isGroupComplete(g, scores)) continue

    const conf = groups[g]
    const nameToId: Record<string, string> = {}
    for (const team of getGroup(g)) nameToId[team.name] = team.id

    const standings = computeStandings(g, scores, nameToId, discipline, teamConduct)

    for (const team of getGroup(g)) {
      if (conf?.first === team.id || conf?.second === team.id || conf?.third === team.id) continue

      const pos = standings.findIndex(s => s.teamId === team.id)
      if (pos === 2) {
        if ((thirdRanks[g] ?? 99) > 8) eliminated.add(team.id)
        continue
      }
      if (pos >= 3) eliminated.add(team.id)
    }
  }

  for (const [matchId, winner] of Object.entries(knockout) as [MatchId, string][]) {
    const { homeId, awayId } = resolveMatchParticipants(matchId, groups, knockout)
    if (homeId && homeId !== winner) eliminated.add(homeId)
    if (awayId && awayId !== winner) eliminated.add(awayId)
  }

  return eliminated
}

export function useEliminatedTeamIds(): Set<string> {
  const runtimeKnockout = useStore(runtimeResultsStore, s => s.knockout)
  const runtimeScores = useStore(runtimeResultsStore, s => s.scores)

  return useMemo(() => {
    const scores = { ...LIVE_RESULTS.scores, ...runtimeScores } as GroupScores
    return computeEliminatedTeamIds({
      scores,
      discipline: LIVE_RESULTS.discipline,
      teamConduct: LIVE_RESULTS.teamConduct,
      knockout: mergeKnockout(runtimeKnockout),
    })
  }, [runtimeKnockout, runtimeScores])
}
