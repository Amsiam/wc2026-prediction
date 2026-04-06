import type { GroupKey, MatchId } from './teams'

// ─────────────────────────────────────────────────────────────────────────────
// Update these as the tournament progresses.
// Once a value is set here it becomes read-only in the UI — users cannot
// change it and shared links cannot override it.
// ─────────────────────────────────────────────────────────────────────────────

/** Official group-stage results. Add keys as each group is finalised. */
export const CONFIRMED_GROUPS: Partial<Record<GroupKey, {
  first?: string   // team ID of group winner
  second?: string  // team ID of runner-up
  third?: string   // team ID of best 3rd-place qualifier from this group
  thirdSlot?: MatchId
}>> = {
  // Example — uncomment & fill in when group A is done:
  // A: { first: 'MEX', second: 'KOR', third: 'CZE', thirdSlot: 'r32_m1' },
}

/** Official knockout results. Add matchId → winner teamId as each match is played. */
export const CONFIRMED_MATCHES: Partial<Record<MatchId, string>> = {
  // r32_m1: 'MEX',
}

/** Official group-stage scores. Add matchNumber → { home, away } as each match is played. */
export const CONFIRMED_SCORES: Record<number, { home: number; away: number }> = {
  // 1: { home: 2, away: 0 },  // M1: Mexico 2-0 South Africa
}

// ── Helpers used by store and UI ─────────────────────────────────────────────

export function isGroupFieldLocked(group: GroupKey, field: 'first' | 'second' | 'third'): boolean {
  return CONFIRMED_GROUPS[group]?.[field] !== undefined
}

export function isMatchLocked(matchId: MatchId): boolean {
  return CONFIRMED_MATCHES[matchId] !== undefined
}

export function isScoreLocked(matchNumber: number): boolean {
  return CONFIRMED_SCORES[matchNumber] !== undefined
}
