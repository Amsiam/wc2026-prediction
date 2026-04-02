import { R32_FIXTURES, BRACKET_TREE, getGroup, getTeamById } from '../data/teams'
import type { MatchId, GroupKey, R32Fixture, Team } from '../data/teams'
import type { BracketState } from '../store/types'

/** All R32-level ancestor match IDs of a given match (or the match itself if it is R32) */
export function getR32Ancestors(matchId: MatchId): MatchId[] {
  if (matchId.startsWith('r32')) return [matchId]
  const children = (BRACKET_TREE as Record<string, readonly [string, string]>)[matchId]
  if (!children) return []
  return [
    ...getR32Ancestors(children[0] as MatchId),
    ...getR32Ancestors(children[1] as MatchId),
  ]
}

export interface SlotDescriptor {
  r32Id: MatchId
  side: 'home' | 'away'
  opponentLabel: string  // e.g. "Group E winner", "Best 3rd (C/E/F/H/I)"
}

function formatSideLabel(fixture: R32Fixture, side: 'home' | 'away'): string {
  const slot = side === 'home' ? fixture.home : fixture.away
  if (slot.source === 'winner') return `Group ${slot.group} winner`
  if (slot.source === 'runner') return `Group ${slot.group} runner-up`
  return `Best 3rd (${slot.groups!.join('/')})`
}

/**
 * Which positions can a team from `group` occupy to legally reach `targetMatchId`?
 * Derived purely from R32_FIXTURES — no hardcoded path tables.
 */
export function getValidPositions(
  targetMatchId: MatchId,
  group: GroupKey
): ('first' | 'second' | 'third')[] {
  const ancestors = getR32Ancestors(targetMatchId)
  const options = new Set<'first' | 'second' | 'third'>()

  for (const r32Id of ancestors) {
    const f = R32_FIXTURES.find(f => f.id === r32Id)
    if (!f) continue
    if ((f.home.source === 'winner' && f.home.group === group) ||
        (f.away.source === 'winner' && f.away.group === group))
      options.add('first')
    if ((f.home.source === 'runner' && f.home.group === group) ||
        (f.away.source === 'runner' && f.away.group === group))
      options.add('second')
    if (f.away.source === 'third' && f.away.groups?.includes(group))
      options.add('third')
  }

  return [...options]
}

/**
 * Specific R32 entry slots for a group at a given position reaching `targetMatchId`.
 * For 'third', may return multiple matches (disambiguation needed if >1).
 */
export function getPossibleR32Slots(
  targetMatchId: MatchId,
  group: GroupKey,
  position: 'first' | 'second' | 'third'
): SlotDescriptor[] {
  const ancestors = getR32Ancestors(targetMatchId)
  const result: SlotDescriptor[] = []

  for (const r32Id of ancestors) {
    const f = R32_FIXTURES.find(f => f.id === r32Id)
    if (!f) continue

    if (position === 'first') {
      if (f.home.source === 'winner' && f.home.group === group)
        result.push({ r32Id, side: 'home', opponentLabel: formatSideLabel(f, 'away') })
      if (f.away.source === 'winner' && f.away.group === group)
        result.push({ r32Id, side: 'away', opponentLabel: formatSideLabel(f, 'home') })
    }
    if (position === 'second') {
      if (f.home.source === 'runner' && f.home.group === group)
        result.push({ r32Id, side: 'home', opponentLabel: formatSideLabel(f, 'away') })
      if (f.away.source === 'runner' && f.away.group === group)
        result.push({ r32Id, side: 'away', opponentLabel: formatSideLabel(f, 'home') })
    }
    if (position === 'third') {
      if (f.away.source === 'third' && f.away.groups?.includes(group))
        result.push({ r32Id, side: 'away', opponentLabel: formatSideLabel(f, 'home') })
    }
  }

  return result
}

export function getR32SlotPool(r32Id: MatchId, side: 'home' | 'away', state: BracketState): Team[] {
  const fixture = R32_FIXTURES.find(f => f.id === r32Id)
  if (!fixture) return []
  const seed = side === 'home' ? fixture.home : fixture.away

  let base: Team[]
  if (seed.source === 'third') {
    base = (seed.groups ?? []).flatMap(g => getGroup(g))
  } else {
    base = seed.group ? getGroup(seed.group) : []
  }

  return base.filter(team => {
    const gp = state.groups[team.group as GroupKey]
    if (!gp) return true
    if (seed.source === 'winner' && (gp.second === team.id || gp.third === team.id)) return false
    if (seed.source === 'runner' && (gp.first === team.id || gp.third === team.id)) return false
    if (seed.source === 'third') {
      if (gp.first === team.id || gp.second === team.id) return false
      // Exclude if this group's 3rd is already assigned to a different R32 slot
      if (gp.thirdSlot !== null && gp.thirdSlot !== r32Id) return false
    }
    return true
  })
}

/**
 * Recursively collects all teams that could still win `matchId`, using
 * actual match winners at every level to narrow the result.
 * - If the match already has a winner → just that team.
 * - If it's an R32 leaf → the eligible participants for both slots.
 * - Otherwise → union of reachable teams from both child matches.
 */
function getReachableTeams(matchId: MatchId, state: BracketState): Team[] {
  const winner = state.matches[matchId]?.winner
  if (winner) {
    const t = getTeamById(winner)
    return t ? [t] : []
  }

  const children = (BRACKET_TREE as Record<string, readonly [string, string]>)[matchId]
  if (!children) {
    // R32 leaf — return eligible participants for both slots
    const poolMap = new Map<string, Team>()
    for (const t of getR32SlotPool(matchId, 'home', state)) poolMap.set(t.id, t)
    for (const t of getR32SlotPool(matchId, 'away', state)) poolMap.set(t.id, t)
    return [...poolMap.values()]
  }

  const poolMap = new Map<string, Team>()
  for (const childId of children) {
    for (const t of getReachableTeams(childId as MatchId, state)) poolMap.set(t.id, t)
  }
  return [...poolMap.values()]
}

export function getSlotPool(matchId: MatchId, side: 'home' | 'away', state: BracketState): Team[] {
  const children = (BRACKET_TREE as Record<string, readonly string[]>)[matchId]
  if (!children) return []
  const childId = children[side === 'home' ? 0 : 1] as MatchId
  return getReachableTeams(childId, state)
}

export function inferTeamR32Entry(
  team: Team,
  childId: MatchId
): { r32Id: MatchId; position: 'first' | 'second' | 'third'; group: GroupKey } | null {
  const r32Ids: MatchId[] = childId.startsWith('r32') ? [childId] : getR32Ancestors(childId)
  for (const r32Id of r32Ids) {
    const fixture = R32_FIXTURES.find(f => f.id === r32Id)
    if (!fixture) continue
    for (const seed of [fixture.home, fixture.away]) {
      if (seed.source !== 'third' && seed.group === (team.group as GroupKey)) {
        return { r32Id, position: seed.source === 'winner' ? 'first' : 'second', group: seed.group! }
      }
      if (seed.source === 'third' && (seed.groups ?? []).includes(team.group as GroupKey)) {
        return { r32Id, position: 'third', group: team.group as GroupKey }
      }
    }
  }
  return null
}
