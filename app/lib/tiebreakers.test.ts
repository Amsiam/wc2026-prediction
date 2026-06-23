import { describe, it, expect } from 'vitest'
import { rankTeamsTiedOnPoints } from './tiebreakers'
import type { TeamStanding } from './standings'

function standing(
  teamId: string,
  overrides: Partial<TeamStanding> = {},
): TeamStanding {
  return {
    teamId,
    played: 3,
    won: 1,
    drawn: 1,
    lost: 1,
    gf: 3,
    ga: 3,
    gd: 0,
    points: 4,
    fairPlay: 0,
    ...overrides,
  }
}

describe('FIFA 2026 tiebreakers', () => {
  it('ranks head-to-head winner above opponent despite worse overall GD', () => {
    const teams = [
      standing('MEX', { gd: -2, gf: 3, fairPlay: 0 }),
      standing('KOR', { gd: 5, gf: 8, fairPlay: 0 }),
    ]
    const h2hFor = () =>
      new Map([
        ['MEX', { pts: 3, gd: 1, gf: 2 }],
        ['KOR', { pts: 0, gd: -1, gf: 1 }],
      ])
    expect(rankTeamsTiedOnPoints(teams, h2hFor).map(t => t.teamId)).toEqual(['MEX', 'KOR'])
  })

  it('separates a mini-league leader then resolves the rest recursively', () => {
    const teams = [
      standing('A', { gf: 5, gd: 2 }),
      standing('B', { gf: 4, gd: 1 }),
      standing('C', { gf: 3, gd: 0 }),
    ]
    const h2hFor = (ids: string[]) => {
      const h = new Map(ids.map(id => [id, { pts: 0, gd: 0, gf: 0 }]))
      if (ids.includes('A') && ids.includes('B') && ids.includes('C')) {
        h.set('A', { pts: 6, gd: 2, gf: 4 })
        h.set('B', { pts: 3, gd: 0, gf: 2 })
        h.set('C', { pts: 3, gd: -2, gf: 1 })
      } else if (ids.includes('B') && ids.includes('C')) {
        h.set('B', { pts: 3, gd: 1, gf: 2 })
        h.set('C', { pts: 0, gd: -1, gf: 1 })
      }
      return h
    }
    expect(rankTeamsTiedOnPoints(teams, h2hFor).map(t => t.teamId)).toEqual(['A', 'B', 'C'])
  })

  it('falls through to overall GD when head-to-head is identical', () => {
    const teams = [
      standing('A', { gd: 3, gf: 5 }),
      standing('B', { gd: 1, gf: 5 }),
    ]
    const h2hFor = () =>
      new Map([
        ['A', { pts: 3, gd: 0, gf: 2 }],
        ['B', { pts: 3, gd: 0, gf: 2 }],
      ])
    expect(rankTeamsTiedOnPoints(teams, h2hFor).map(t => t.teamId)).toEqual(['A', 'B'])
  })
})
