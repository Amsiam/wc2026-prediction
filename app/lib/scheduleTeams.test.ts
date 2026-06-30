import { describe, it, expect } from 'vitest'
import { resolveScheduleTeam } from './scheduleTeams'
import { EMPTY_STATE } from './encoding'
import type { BracketState } from '../store/types'

function confirmedState(): BracketState {
  return {
    ...EMPTY_STATE,
    groups: {
      ...EMPTY_STATE.groups,
      A: { first: 'MEX', second: 'RSA', third: null, thirdRank: null, thirdSlot: null },
      B: { first: 'SUI', second: 'CAN', third: 'BIH', thirdRank: 3, thirdSlot: 'r32_m9' },
      C: { first: 'BRA', second: 'MAR', third: null, thirdRank: null, thirdSlot: null },
      D: { first: 'USA', second: 'AUS', third: 'PAR', thirdRank: 4, thirdSlot: 'r32_m2' },
      E: { first: 'GER', second: 'CIV', third: 'ECU', thirdRank: 5, thirdSlot: 'r32_m7' },
      F: { first: 'NED', second: 'JPN', third: 'SWE', thirdRank: 7, thirdSlot: 'r32_m5' },
    },
    matches: {
      ...EMPTY_STATE.matches,
      r32_m1: { winner: 'CAN' },
    },
  }
}

describe('resolveScheduleTeam', () => {
  it('resolves FIFA R32 placeholders 2A and 1F', () => {
    const { groups, matches } = confirmedState()
    const home = resolveScheduleTeam('2A', groups, matches, {}, 73)
    const away = resolveScheduleTeam('2B', groups, matches, {}, 73)
    expect(home.name).toBe('South Africa')
    expect(away.name).toBe('Canada')
  })

  it('resolves W73 winner for R16 feeder', () => {
    const { groups, matches } = confirmedState()
    const team = resolveScheduleTeam('W73', groups, matches, {}, 90)
    expect(team.name).toBe('Canada')
    expect(team.known).toBe(true)
  })

  it('resolves third-place slot when assigned', () => {
    const { groups, matches } = confirmedState()
    const team = resolveScheduleTeam('3ABCDF', groups, matches, {}, 74)
    expect(team.name).toBe('Paraguay')
  })
})
