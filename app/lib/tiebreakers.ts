import { compareFifaRanking } from '../data/fifaRankings'
import type { TeamStanding } from './standings'

export interface H2HStats {
  pts: number
  gd: number
  gf: number
}

type H2HField = keyof H2HStats

/** Step 2 (d–f) + Step 3 (g–h): overall GD → GF → fair play → FIFA rank → draw. */
export function compareStep2And3(a: TeamStanding, b: TeamStanding): number {
  if (b.gd !== a.gd) return b.gd - a.gd
  if (b.gf !== a.gf) return b.gf - a.gf
  if (b.fairPlay !== a.fairPlay) return b.fairPlay - a.fairPlay
  const fifa = compareFifaRanking(a.teamId, b.teamId)
  if (fifa !== 0) return fifa
  return a.teamId.localeCompare(b.teamId)
}

/** Third-placed teams across groups: pts → step 2/3 (no cross-group head-to-head). */
export function compareThirdPlaceStanding(a: TeamStanding, b: TeamStanding): number {
  if (b.points !== a.points) return b.points - a.points
  return compareStep2And3(a, b)
}

/**
 * FIFA 2026 Article 13 — rank teams tied on points within a group.
 * Step 1: head-to-head (pts → GD → GF), with restart when one team is separated.
 * Step 2/3: overall GD → GF → fair play → FIFA ranking → draw.
 */
export function rankTeamsTiedOnPoints(
  teams: TeamStanding[],
  h2hFor: (teamIds: string[]) => Map<string, H2HStats>,
): TeamStanding[] {
  if (teams.length <= 1) return teams
  return rankByHeadToHead(teams, h2hFor)
}

function rankByHeadToHead(
  teams: TeamStanding[],
  h2hFor: (teamIds: string[]) => Map<string, H2HStats>,
): TeamStanding[] {
  if (teams.length <= 1) return teams

  const h = h2hFor(teams.map(t => t.teamId))

  for (const field of ['pts', 'gd', 'gf'] as H2HField[]) {
    const values = teams.map(t => h.get(t.teamId)![field])
    const max = Math.max(...values)
    const min = Math.min(...values)
    if (max === min) continue

    const top = teams.filter(t => h.get(t.teamId)![field] === max)
    const bottom = teams.filter(t => h.get(t.teamId)![field] < max)

    if (top.length === 1) {
      return [top[0], ...rankByHeadToHead(teams.filter(t => t !== top[0]), h2hFor)]
    }

    if (bottom.length > 0) {
      return [
        ...rankByHeadToHead(top, h2hFor),
        ...rankByHeadToHead(bottom, h2hFor),
      ]
    }
  }

  return applyStep2And3(teams)
}

function applyStep2And3(teams: TeamStanding[]): TeamStanding[] {
  return [...teams].sort(compareStep2And3)
}
