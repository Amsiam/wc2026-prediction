import type { GroupKey, MatchId } from './teams'
import type { MatchDiscipline } from '../lib/fairPlay'
import { LIVE_RESULTS } from './liveResults'
import { SCHEDULE } from './schedule'
import { computeBracketQualifiers } from '../lib/computeBracketQualifiers'

const GROUP_MATCH_NUMBERS = new Set(
  SCHEDULE.filter(m => m.round === 'Group Stage').map(m => m.matchNumber),
)

function groupStageOnly<T>(record: Record<number, T>): Record<number, T> {
  return Object.fromEntries(
    Object.entries(record).filter(([n]) => GROUP_MATCH_NUMBERS.has(Number(n))),
  ) as Record<number, T>
}

function syncFromLiveResults() {
  const { groups } = computeBracketQualifiers(
    LIVE_RESULTS.scores,
    LIVE_RESULTS.discipline,
    LIVE_RESULTS.teamConduct,
    { completeOnly: true },
  )
  return {
    groups,
    scores: groupStageOnly(LIVE_RESULTS.scores),
    discipline: groupStageOnly(LIVE_RESULTS.discipline),
    matches: LIVE_RESULTS.knockout,
  }
}

const SYNCED = syncFromLiveResults()

// ─────────────────────────────────────────────────────────────────────────────
// Official results — derived from liveResults.ts (synced via GitHub Actions).
// Manual overrides below take precedence over synced data.
// ─────────────────────────────────────────────────────────────────────────────

/** Manual overrides (optional). Merged on top of synced groups. */
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
  ...SYNCED.groups,
  ...MANUAL_CONFIRMED_GROUPS,
}

/** Official knockout results. */
export const CONFIRMED_MATCHES: Partial<Record<MatchId, string>> = {
  ...SYNCED.matches,
  ...MANUAL_CONFIRMED_MATCHES,
}

/** Official group-stage scores — locks score entry in UI. */
export const CONFIRMED_SCORES: Record<number, { home: number; away: number }> = {
  ...SYNCED.scores,
}

/** Official cards / fair-play per match. */
export const CONFIRMED_DISCIPLINE: Record<number, MatchDiscipline> = {
  ...SYNCED.discipline,
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
