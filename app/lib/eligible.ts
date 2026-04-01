import { R32_FIXTURES, BRACKET_TREE, getGroup } from '../data/teams'
import type { MatchId, Team, SeedSource } from '../data/teams'
import type { BracketState } from '../store/types'

// Get all teams that could be seeded into a given side of an R32 match
function getSeedPool(seed: SeedSource): Team[] {
  if (seed.source === 'third') {
    // third-place slot: teams from all candidate groups
    return (seed.groups ?? []).flatMap(g => getGroup(g))
  }
  // winner or runner: teams from the specific group
  return seed.group ? getGroup(seed.group) : []
}

// Collect all R32 match IDs that are ancestors of (or equal to) a given match
function getR32Ancestors(matchId: MatchId): MatchId[] {
  if (matchId.startsWith('r32')) return [matchId]
  const children = (BRACKET_TREE as Record<string, readonly [string, string]>)[matchId]
  if (!children) return []
  return [
    ...getR32Ancestors(children[0] as MatchId),
    ...getR32Ancestors(children[1] as MatchId),
  ]
}

// Get all teams in the seed pool for a given R32 match
function getR32Pool(r32Id: MatchId): Team[] {
  const fixture = R32_FIXTURES.find(f => f.id === r32Id)
  if (!fixture) return []
  return [...getSeedPool(fixture.home), ...getSeedPool(fixture.away)]
}

function getEliminatedForSlot(matchId: MatchId, state: BracketState): Set<string> {
  const eliminated = new Set<string>()

  function process(mId: MatchId) {
    const pick = state.matches[mId]
    if (pick?.winner) {
      // All teams in this match's R32 pool except the winner are eliminated
      for (const r32Id of getR32Ancestors(mId)) {
        for (const team of getR32Pool(r32Id)) {
          if (team.id !== pick.winner) eliminated.add(team.id)
        }
      }
    }
    if (mId.startsWith('r32')) return
    const children = (BRACKET_TREE as Record<string, readonly [string, string]>)[mId]
    if (children) {
      process(children[0] as MatchId)
      process(children[1] as MatchId)
    }
  }

  // Process children of the target slot (not the slot itself — user is picking for it)
  if (!matchId.startsWith('r32')) {
    const children = (BRACKET_TREE as Record<string, readonly [string, string]>)[matchId]
    if (children) {
      process(children[0] as MatchId)
      process(children[1] as MatchId)
    }
  }

  return eliminated
}

export function getEligibleTeams(matchId: MatchId, state: BracketState): Team[] {
  const r32Ancestors = getR32Ancestors(matchId)

  const poolMap = new Map<string, Team>()
  for (const r32Id of r32Ancestors) {
    for (const team of getR32Pool(r32Id)) {
      poolMap.set(team.id, team)
    }
  }

  const eliminated = getEliminatedForSlot(matchId, state)

  return [...poolMap.values()].filter(t => !eliminated.has(t.id))
}
