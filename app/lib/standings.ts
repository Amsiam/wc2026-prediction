import { SCHEDULE } from '../data/schedule'
import { TEAMS } from '../data/teams'
import type { GroupKey } from '../data/teams'

export interface TeamStanding {
  teamId: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
}

export type GroupScores = Record<number, { home: number | null; away: number | null }>

/** Map schedule display name → team id */
function resolveTeamId(name: string, overrides: Record<string, string>): string | undefined {
  // Check override first (scheduleDisplayName → teamId)
  if (overrides[name]) return overrides[name]
  // Exact name match
  return TEAMS.find(t => t.name === name)?.id
}

/** All group stage matches for a group, ordered by match number */
export function getGroupMatches(groupKey: GroupKey) {
  return SCHEDULE.filter(m => m.group === groupKey && m.round === 'Group Stage')
    .sort((a, b) => a.matchNumber - b.matchNumber)
}

/** Compute standings from recorded scores. nameToId maps schedule names that don't match team.name */
export function computeStandings(
  groupKey: GroupKey,
  scores: GroupScores,
  nameToId: Record<string, string> = {}
): TeamStanding[] {
  const groupMatches = getGroupMatches(groupKey)
  const rows = new Map<string, TeamStanding>()

  for (const team of TEAMS.filter(t => t.group === groupKey)) {
    rows.set(team.id, { teamId: team.id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 })
  }

  for (const match of groupMatches) {
    const score = scores[match.matchNumber]
    if (score?.home == null || score?.away == null) continue

    const homeId = resolveTeamId(match.homeTeam, nameToId)
    const awayId = resolveTeamId(match.awayTeam, nameToId)
    if (!homeId || !awayId) continue

    const home = rows.get(homeId)
    const away = rows.get(awayId)
    if (!home || !away) continue

    const h = score.home
    const a = score.away

    home.played++; away.played++
    home.gf += h; home.ga += a
    away.gf += a; away.ga += h

    if (h > a)      { home.won++;   home.points  += 3; away.lost++ }
    else if (h < a) { away.won++;   away.points  += 3; home.lost++ }
    else            { home.drawn++; home.points  += 1; away.drawn++; away.points += 1 }
  }

  // Recompute GD
  for (const r of rows.values()) r.gd = r.gf - r.ga

  return [...rows.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gd     !== a.gd)     return b.gd     - a.gd
    if (b.gf     !== a.gf)     return b.gf     - a.gf
    return a.teamId.localeCompare(b.teamId)
  })
}

/** True when all 6 group-stage matches for this group have both scores set */
export function isGroupComplete(groupKey: GroupKey, scores: GroupScores): boolean {
  return getGroupMatches(groupKey).every(m => {
    const s = scores[m.matchNumber]
    return s?.home != null && s?.away != null
  })
}
