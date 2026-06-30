import { BRACKET_TREE, getTeamById, TEAMS } from '../data/teams'
import type { GroupKey, MatchId } from '../data/teams'
import type { GroupPick } from '../store/types'
import { CONFIRMED_MATCHES } from '../data/confirmed'
import { MATCH_NUMBER_BY_BRACKET } from './knockoutParticipants'

export interface ResolvedTeam {
  name: string
  flagCode?: string
  known: boolean
}

function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[’']/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const TEAM_NAME_ALIASES: Record<string, string> = {
  'usa': 'united states',
  'turkiye': 'turkey',
  'korea republic': 'south korea',
  'czechia': 'czech republic',
  'bosnia and herzegovina': 'bosnia herzegovina',
  'cote divoire': 'ivory coast',
  'cape verde': 'cabo verde',
  'congo dr': 'dr congo',
  'to be announced': 'tbd',
}

function canonicalTeamName(name: string): string {
  const n = normalizeTeamName(name)
  return TEAM_NAME_ALIASES[n] ?? n
}

function teamFromId(
  teamId: string,
  overrides: Record<string, { name: string; flagCode: string }>,
): ResolvedTeam {
  const ov = overrides[teamId]
  const team = getTeamById(teamId)
  return {
    name: ov?.name ?? team?.name ?? teamId,
    flagCode: ov?.flagCode ?? team?.flagCode,
    known: true,
  }
}

/** Resolve FIFA schedule placeholder or team name to display info. */
export function resolveScheduleTeam(
  str: string,
  groups: Record<GroupKey, GroupPick>,
  matches: Record<MatchId, { winner: string | null }>,
  overrides: Record<string, { name: string; flagCode: string }>,
  matchNumber?: number,
): ResolvedTeam {
  // Group winner: "1E" or legacy "1st E"
  const first = str.match(/^1(?:st )?([A-L])$/)
  if (first) {
    const teamId = groups[first[1] as GroupKey]?.first
    if (teamId) return teamFromId(teamId, overrides)
    return { name: `1st ${first[1]}`, known: false }
  }

  // Group runner-up: "2A" or legacy "2nd A"
  const second = str.match(/^2(?:nd )?([A-L])$/)
  if (second) {
    const teamId = groups[second[1] as GroupKey]?.second
    if (teamId) return teamFromId(teamId, overrides)
    return { name: `2nd ${second[1]}`, known: false }
  }

  // Third-place slot: "3ABCDF" — resolve when bracket slot is assigned
  const third = str.match(/^3([A-L]+)$/)
  if (third) {
    const letters = [...third[1]] as GroupKey[]
    if (matchNumber != null) {
      const bracketId = Object.entries(MATCH_NUMBER_BY_BRACKET)
        .find(([, n]) => n === matchNumber)?.[0] as MatchId | undefined
      if (bracketId) {
        for (const g of letters) {
          const gp = groups[g]
          if (gp.third && gp.thirdSlot === bracketId) {
            return teamFromId(gp.third, overrides)
          }
        }
      }
    }
    return { name: `3rd (${letters.join('/')})`, known: false }
  }

  if (str.startsWith('3rd')) return { name: str, known: false }

  // Winner of match N: "W73"
  const winner = str.match(/^W(\d+)$/)
  if (winner) {
    const num = parseInt(winner[1], 10)
    const bracketId = Object.entries(MATCH_NUMBER_BY_BRACKET)
      .find(([, n]) => n === num)?.[0] as MatchId | undefined
    if (bracketId) {
      const teamId = CONFIRMED_MATCHES[bracketId] ?? matches[bracketId]?.winner
      if (teamId) return teamFromId(teamId, overrides)
    }
    return { name: str, known: false }
  }

  // Loser of match N: "L101" (3rd place)
  const loser = str.match(/^L(\d+)$/)
  if (loser) {
    const num = parseInt(loser[1], 10)
    const bracketId = Object.entries(MATCH_NUMBER_BY_BRACKET)
      .find(([, n]) => n === num)?.[0] as MatchId | undefined
    if (bracketId) {
      const m = matches[bracketId]
      const confirmedWinner = CONFIRMED_MATCHES[bracketId]
      const winnerId = confirmedWinner ?? m?.winner
      const children = (BRACKET_TREE as Record<string, readonly [MatchId, MatchId]>)[bracketId]
      if (children && winnerId) {
        const homeId = CONFIRMED_MATCHES[children[0]] ?? matches[children[0]]?.winner
        const awayId = CONFIRMED_MATCHES[children[1]] ?? matches[children[1]]?.winner
        const loserId = homeId === winnerId ? awayId : homeId
        if (loserId) return teamFromId(loserId, overrides)
      }
    }
    return { name: str, known: false }
  }

  const needle = canonicalTeamName(str)
  const teamByName = TEAMS.find(t => canonicalTeamName(t.name) === needle)
  if (teamByName) {
    const ov = overrides[teamByName.id]
    return { name: ov?.name ?? str, flagCode: ov?.flagCode ?? teamByName.flagCode, known: true }
  }

  return { name: str, known: false }
}

export function scheduleMatchBracketId(matchNumber: number): MatchId | undefined {
  return Object.entries(MATCH_NUMBER_BY_BRACKET)
    .find(([, n]) => n === matchNumber)?.[0] as MatchId | undefined
}
