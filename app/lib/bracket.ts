import { R32_FIXTURES, BRACKET_TREE } from '../data/teams'
import type { MatchId, GroupKey, R32Fixture } from '../data/teams'

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
