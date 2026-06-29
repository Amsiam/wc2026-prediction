import type { GroupKey, MatchId } from './teams'
import type { MatchDiscipline } from '../lib/fairPlay'
import { AUTO_CONFIRMED } from './autoConfirmed'

// ─────────────────────────────────────────────────────────────────────────────
// Official results — auto-filled from web sync (autoConfirmed.ts) via GitHub
// Actions. Manual overrides below take precedence over synced data.
// ─────────────────────────────────────────────────────────────────────────────

/** Manual overrides (optional). Merged on top of AUTO_CONFIRMED.groups. */
export const MANUAL_CONFIRMED_GROUPS: Partial<Record<GroupKey, {
  first?: string
  second?: string
  third?: string
  thirdSlot?: MatchId
}>> = {}

/** Manual knockout overrides (optional). */
export const MANUAL_CONFIRMED_MATCHES: Partial<Record<MatchId, string>> = {}

/** Official group-stage results — locks bracket paths when set. */
export const CONFIRMED_GROUPS: Partial<Record<GroupKey, {
  first?: string
  second?: string
  third?: string
  thirdSlot?: MatchId
}>> = {
  ...AUTO_CONFIRMED.groups,
  ...MANUAL_CONFIRMED_GROUPS,
}

/** Official knockout results. */
export const CONFIRMED_MATCHES: Partial<Record<MatchId, string>> = {
  ...AUTO_CONFIRMED.matches,
  ...MANUAL_CONFIRMED_MATCHES,
}

/** Official group-stage scores — locks score entry in UI. */
export const CONFIRMED_SCORES: Record<number, { home: number; away: number }> = {
  ...AUTO_CONFIRMED.scores,
}

/** Official cards / fair-play per match. */
export const CONFIRMED_DISCIPLINE: Record<number, MatchDiscipline> = {
  ...AUTO_CONFIRMED.discipline,
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

export function isDisciplineLocked(matchNumber: number): boolean {
  return CONFIRMED_DISCIPLINE[matchNumber] !== undefined
}
