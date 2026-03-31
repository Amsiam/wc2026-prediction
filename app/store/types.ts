import type { GroupKey, MatchId } from '../data/teams'

export type TeamId = string // FIFA code e.g. "ARG"

export interface GroupPick {
  first: TeamId | null
  second: TeamId | null
  thirdRank: number | null // 1=best qualifier, 12=worst; null=unset
}

export interface MatchPick {
  winner: TeamId | null
}

export interface BracketState {
  groups: Record<GroupKey, GroupPick>
  matches: Record<MatchId, MatchPick>
}

export type Round = 'r32' | 'r16' | 'qf' | 'sf' | 'final' | 'third_place'

export function getRound(matchId: MatchId): Round {
  if (matchId === 'final') return 'final'
  if (matchId === 'third_place') return 'third_place'
  if (matchId.startsWith('r32')) return 'r32'
  if (matchId.startsWith('r16')) return 'r16'
  if (matchId.startsWith('qf')) return 'qf'
  return 'sf'
}
