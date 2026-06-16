import { SCHEDULE } from '../data/schedule'
import { TEAMS } from '../data/teams'
import type { GroupKey } from '../data/teams'
import { compareFifaRanking } from '../data/fifaRankings'
import type { MatchDiscipline, TeamDiscipline } from './fairPlay'
import { EMPTY_MATCH_DISCIPLINE, totalConduct } from './fairPlay'

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
  /** FIFA fair-play conduct (higher = fewer cards). */
  fairPlay: number
}

export type GroupScores = Record<number, { home: number | null; away: number | null }>
export type GroupDiscipline = Record<number, MatchDiscipline>

/** Map schedule display name → team id */
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
  'ir iran': 'iran',
  'congo dr': 'dr congo',
}

export function canonicalTeamName(name: string): string {
  const n = normalizeTeamName(name)
  return TEAM_NAME_ALIASES[n] ?? n
}

export function resolveTeamId(name: string, overrides: Record<string, string>): string | undefined {
  // Check override first (scheduleDisplayName → teamId)
  if (overrides[name]) return overrides[name]
  // Exact name match
  const needle = canonicalTeamName(name)
  return TEAMS.find(t => canonicalTeamName(t.name) === needle)?.id
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
  nameToId: Record<string, string> = {},
  discipline: GroupDiscipline = {},
  teamConduct: Record<string, number> = {},
): TeamStanding[] {
  const groupMatches = getGroupMatches(groupKey)
  const rows = new Map<string, TeamStanding>()
  const disciplineByTeam = new Map<string, TeamDiscipline[]>()

  for (const team of TEAMS.filter(t => t.group === groupKey)) {
    rows.set(team.id, { teamId: team.id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, fairPlay: 0 })
    disciplineByTeam.set(team.id, [])
  }

  for (const match of groupMatches) {
    const score = scores[match.matchNumber]
    const cards = discipline[match.matchNumber] ?? EMPTY_MATCH_DISCIPLINE
    if (score?.home == null || score?.away == null) continue

    const homeId = resolveTeamId(match.homeTeam, nameToId)
    const awayId = resolveTeamId(match.awayTeam, nameToId)
    if (!homeId || !awayId) continue

    const home = rows.get(homeId)
    const away = rows.get(awayId)
    if (!home || !away) continue

    disciplineByTeam.get(homeId)!.push(cards.home)
    disciplineByTeam.get(awayId)!.push(cards.away)

    const h = score.home
    const a = score.away

    home.played++; away.played++
    home.gf += h; home.ga += a
    away.gf += a; away.ga += h

    if (h > a)      { home.won++;   home.points  += 3; away.lost++ }
    else if (h < a) { away.won++;   away.points  += 3; home.lost++ }
    else            { home.drawn++; home.points  += 1; away.drawn++; away.points += 1 }
  }

  // Recompute GD and fair play
  for (const r of rows.values()) {
    r.gd = r.gf - r.ga
    r.fairPlay = teamConduct[r.teamId] ?? totalConduct(disciplineByTeam.get(r.teamId) ?? [])
  }

  const allTeams = [...rows.values()]

  // Head-to-head stats among a subset of tied teams
  function h2h(teamIds: string[]): Map<string, { pts: number; gd: number; gf: number }> {
    const h = new Map(teamIds.map(id => [id, { pts: 0, gd: 0, gf: 0 }]))
    const idSet = new Set(teamIds)
    for (const match of groupMatches) {
      const score = scores[match.matchNumber]
      if (score?.home == null || score?.away == null) continue
      const homeId = resolveTeamId(match.homeTeam, nameToId)
      const awayId = resolveTeamId(match.awayTeam, nameToId)
      if (!homeId || !awayId) continue
      if (!idSet.has(homeId) || !idSet.has(awayId)) continue
      const hv = h.get(homeId)!
      const av = h.get(awayId)!
      const hg = score.home, ag = score.away
      hv.gf += hg; hv.gd += hg - ag
      av.gf += ag; av.gd += ag - hg
      if (hg > ag)      { hv.pts += 3 }
      else if (hg < ag) { av.pts += 3 }
      else              { hv.pts += 1; av.pts += 1 }
    }
    return h
  }

  function sortGroup(teams: TeamStanding[]): TeamStanding[] {
    if (teams.length <= 1) return teams

    // FIFA step 1: overall points → GD → GF (fair play comes after head-to-head)
    const sorted = [...teams].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.gd     !== a.gd)     return b.gd     - a.gd
      if (b.gf     !== a.gf)     return b.gf     - a.gf
      return 0
    })

    const result: TeamStanding[] = []
    let i = 0
    while (i < sorted.length) {
      let j = i + 1
      while (
        j < sorted.length &&
        sorted[j].points === sorted[i].points &&
        sorted[j].gd     === sorted[i].gd &&
        sorted[j].gf     === sorted[i].gf
      ) j++

      const tiedGroup = sorted.slice(i, j)
      if (tiedGroup.length === 1) {
        result.push(tiedGroup[0])
      } else {
        // FIFA step 2: head-to-head among tied teams, then fair play
        const ids = tiedGroup.map(t => t.teamId)
        const h = h2h(ids)
        tiedGroup.sort((a, b) => {
          const ha = h.get(a.teamId)!, hb = h.get(b.teamId)!
          if (hb.pts !== ha.pts) return hb.pts - ha.pts
          if (hb.gd  !== ha.gd)  return hb.gd  - ha.gd
          if (hb.gf  !== ha.gf)  return hb.gf  - ha.gf
          if (b.fairPlay !== a.fairPlay) return b.fairPlay - a.fairPlay
          const fifaCmp = compareFifaRanking(a.teamId, b.teamId)
          if (fifaCmp !== 0) return fifaCmp
          return a.teamId.localeCompare(b.teamId)
        })
        result.push(...tiedGroup)
      }
      i = j
    }
    return result
  }

  return sortGroup(allTeams)
}

/** True when all 6 group-stage matches for this group have both scores set */
export function isGroupComplete(groupKey: GroupKey, scores: GroupScores): boolean {
  return getGroupMatches(groupKey).every(m => {
    const s = scores[m.matchNumber]
    return s?.home != null && s?.away != null
  })
}
