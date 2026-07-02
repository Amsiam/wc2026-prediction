import { BRACKET_TREE, R32_FIXTURES } from '../data/teams'
import type { GroupKey, MatchId } from '../data/teams'
import type { MatchResult } from './matchScore'

export const MATCH_NUMBER_BY_BRACKET: Record<MatchId, number> = {
  r32_m1: 73, r32_m2: 74, r32_m3: 75, r32_m4: 76, r32_m5: 77, r32_m6: 78,
  r32_m7: 79, r32_m8: 80, r32_m9: 81, r32_m10: 82, r32_m11: 83, r32_m12: 84,
  r32_m13: 85, r32_m14: 86, r32_m15: 87, r32_m16: 88,
  r16_m1: 89, r16_m2: 90, r16_m3: 91, r16_m4: 92, r16_m5: 93, r16_m6: 94,
  r16_m7: 95, r16_m8: 96,
  qf_m1: 97, qf_m2: 98, qf_m3: 99, qf_m4: 100,
  sf_m1: 101, sf_m2: 102, third_place: 103, final: 104,
}

export type GroupQualifiers = Partial<Record<GroupKey, {
  first?: string
  second?: string
  third?: string
  thirdSlot?: MatchId
}>>

function resolveR32Seed(
  seed: (typeof R32_FIXTURES)[number]['home'],
  r32Id: MatchId,
  groups: GroupQualifiers,
): string | null {
  if (seed.source === 'winner') return groups[seed.group]?.first ?? null
  if (seed.source === 'runner') return groups[seed.group]?.second ?? null
  if (seed.source === 'third') {
    for (const [g, conf] of Object.entries(groups) as [GroupKey, GroupQualifiers[GroupKey]][]) {
      if (conf?.thirdSlot === r32Id) return conf.third ?? null
    }
  }
  return null
}

export function resolveMatchParticipants(
  matchId: MatchId,
  groups: GroupQualifiers,
  matches: Partial<Record<MatchId, string>>,
): { homeId: string | null; awayId: string | null } {
  if (matchId.startsWith('r32_')) {
    const fixture = R32_FIXTURES.find(f => f.id === matchId)
    if (!fixture) return { homeId: null, awayId: null }
    return {
      homeId: resolveR32Seed(fixture.home, matchId, groups),
      awayId: resolveR32Seed(fixture.away, matchId, groups),
    }
  }

  const children = (BRACKET_TREE as Record<string, readonly [MatchId, MatchId]>)[matchId]
  if (!children) return { homeId: null, awayId: null }
  return {
    homeId: matches[children[0]] ?? null,
    awayId: matches[children[1]] ?? null,
  }
}

/** Flip knockout scores when placeholder schedule rows mis-oriented openfootball ft/pens. */
export function alignKnockoutScoresToSchedule(
  scores: Record<number, MatchResult>,
  groups: GroupQualifiers,
  knockout: Partial<Record<MatchId, string>>,
): Record<number, MatchResult> {
  const aligned = { ...scores }

  for (const [matchId, winnerId] of Object.entries(knockout) as [MatchId, string][]) {
    const { homeId, awayId } = resolveMatchParticipants(matchId, groups, knockout)
    if (!homeId || !awayId) continue

    const num = MATCH_NUMBER_BY_BRACKET[matchId]
    if (num == null) continue
    const s = aligned[num]
    if (!s) continue

    const homeWins = winnerId === homeId
    const awayWins = winnerId === awayId
    const scoreSaysHomeWins = s.home > s.away
    const scoreSaysAwayWins = s.away > s.home
    const pensSaysHomeWins = s.pens != null && s.pens.home > s.pens.away
    const pensSaysAwayWins = s.pens != null && s.pens.away > s.pens.home
    const aetSaysHomeWins = s.aet != null && s.aet.home > s.aet.away
    const aetSaysAwayWins = s.aet != null && s.aet.away > s.aet.home

    const shouldFlip =
      (homeWins && scoreSaysAwayWins) ||
      (awayWins && scoreSaysHomeWins) ||
      (s.home === s.away && s.pens != null && (
        (homeWins && pensSaysAwayWins) ||
        (awayWins && pensSaysHomeWins)
      )) ||
      (s.home === s.away && s.aet != null && (
        (homeWins && aetSaysAwayWins) ||
        (awayWins && aetSaysHomeWins)
      ))

    if (shouldFlip) {
      aligned[num] = {
        home: s.away,
        away: s.home,
        ...(s.aet ? { aet: { home: s.aet.away, away: s.aet.home } } : {}),
        ...(s.pens ? { pens: { home: s.pens.away, away: s.pens.home } } : {}),
      }
    }
  }

  return aligned
}
