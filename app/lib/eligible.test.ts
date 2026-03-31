import { describe, it, expect } from 'vitest'
import { getEligibleTeams } from './eligible'
import { EMPTY_STATE } from './encoding'
import type { BracketState } from '../store/types'

describe('getEligibleTeams', () => {
  it('returns all teams from candidate groups for an r32 slot', () => {
    // r32_m1: runner of Group A vs runner of Group B
    const teams = getEligibleTeams('r32_m1', EMPTY_STATE)
    const ids = teams.map(t => t.id)
    // Group A teams
    expect(ids).toContain('MEX')
    expect(ids).toContain('RSA')
    // Group B teams
    expect(ids).toContain('CAN')
    expect(ids).toContain('SUI')
    expect(ids.length).toBe(8) // 4 per group × 2 groups
  })

  it('returns teams from all candidate groups for a third-place r32 slot', () => {
    // r32_m2: winner of Group E vs 3rd of groups A/B/C/D/F → 5 groups × 4 = 20 teams
    const teams = getEligibleTeams('r32_m2', EMPTY_STATE)
    expect(teams.length).toBe(24) // 6 groups × 4
  })

  it('returns all reachable teams for an r16 slot (union of two r32 slots)', () => {
    // r16_m2 feeds from r32_m1 (A+B) and r32_m3 (F+C) → 16 teams
    const teams = getEligibleTeams('r16_m2', EMPTY_STATE)
    expect(teams.length).toBeGreaterThanOrEqual(16)
  })

  it('excludes a team that lost in a previous round', () => {
    const state: BracketState = {
      ...EMPTY_STATE,
      matches: {
        ...EMPTY_STATE.matches,
        r32_m1: { winner: 'MEX' }, // MEX won r32_m1 which covers Group A + B
      },
    }
    // r16_m2 feeds from r32_m1 and r32_m3
    // Teams in r32_m1's pool that are NOT MEX are losers
    const teams = getEligibleTeams('r16_m2', state)
    const ids = teams.map(t => t.id)
    expect(ids).toContain('MEX')      // winner survives
    expect(ids).not.toContain('RSA')  // Group A loser
    expect(ids).not.toContain('KOR')  // Group A loser
    expect(ids).not.toContain('CAN')  // Group B loser
  })

  it('returns more than 10 teams for the final slot', () => {
    const teams = getEligibleTeams('final', EMPTY_STATE)
    expect(teams.length).toBeGreaterThan(10)
  })
})
