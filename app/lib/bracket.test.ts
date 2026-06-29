import { describe, it, expect } from 'vitest'
import { getR32SlotPool, getSlotPool } from './bracket'
import { EMPTY_STATE } from './encoding'
import type { BracketState } from '../store/types'

/** Mirrors confirmed group qualifiers from synced live results. */
function stateWithConfirmedGroups(): BracketState {
  return {
    ...EMPTY_STATE,
    groups: {
      ...EMPTY_STATE.groups,
      A: { first: 'MEX', second: 'RSA', third: null, thirdRank: null, thirdSlot: null },
      B: { first: 'SUI', second: 'CAN', third: 'BIH', thirdRank: 3, thirdSlot: 'r32_m9' },
      C: { first: 'BRA', second: 'MAR', third: null, thirdRank: null, thirdSlot: null },
      F: { first: 'NED', second: 'JPN', third: 'SWE', thirdRank: 7, thirdSlot: 'r32_m5' },
    },
    matches: {
      ...EMPTY_STATE.matches,
      r32_m1: { winner: 'CAN' },
    },
  }
}

describe('getR32SlotPool', () => {
  it('r32_m3 offers only group winner F and runner C when qualifiers are set', () => {
    const state = stateWithConfirmedGroups()
    const home = getR32SlotPool('r32_m3', 'home', state).map(t => t.id)
    const away = getR32SlotPool('r32_m3', 'away', state).map(t => t.id)
    expect(home).toEqual(['NED'])
    expect(away).toEqual(['MAR'])
  })
})

describe('getSlotPool', () => {
  it('r16_m2 away slot lists only r32_m3 participants (NED, MAR)', () => {
    const state = stateWithConfirmedGroups()
    const pool = getSlotPool('r16_m2', 'away', state).map(t => t.id)
    expect(pool.sort()).toEqual(['MAR', 'NED'])
  })
})
