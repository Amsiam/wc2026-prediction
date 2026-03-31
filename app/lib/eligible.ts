import { R32_FIXTURES, BRACKET_TREE, getGroup } from '../data/teams'
import type { MatchId, GroupKey, Team, SeedSource } from '../data/teams'
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

// Get team IDs eliminated at a specific R32 match (all pool members except the winner)
function getEliminatedAtMatch(r32Id: MatchId, state: BracketState): Set<string> {
  const pick = state.matches[r32Id]
  if (!pick?.winner) return new Set()
  const pool = getR32Pool(r32Id).map(t => t.id)
  return new Set(pool.filter(id => id !== pick.winner))
}

export function getEligibleTeams(matchId: MatchId, state: BracketState): Team[] {
  const r32Ancestors = getR32Ancestors(matchId)

  // Build full pool (unique teams by id)
  const poolMap = new Map<string, Team>()
  for (const r32Id of r32Ancestors) {
    for (const team of getR32Pool(r32Id)) {
      poolMap.set(team.id, team)
    }
  }

  // Build eliminated set: for each r32 ancestor that has a winner set,
  // all other pool members of that r32 match are eliminated
  const eliminated = new Set<string>()
  for (const r32Id of r32Ancestors) {
    for (const id of getEliminatedAtMatch(r32Id, state)) {
      eliminated.add(id)
    }
  }
  // Winners are never eliminated
  for (const r32Id of r32Ancestors) {
    const winner = state.matches[r32Id]?.winner
    if (winner) eliminated.delete(winner)
  }

  return [...poolMap.values()].filter(t => !eliminated.has(t.id))
}
