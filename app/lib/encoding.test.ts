import { describe, it, expect } from 'vitest'
import { encodePicks, decodePicks, EMPTY_STATE } from './encoding'
import type { BracketState } from '../store/types'

describe('encodePicks / decodePicks', () => {
  it('roundtrips empty state', () => {
    const decoded = decodePicks(encodePicks(EMPTY_STATE))
    expect(decoded).toEqual(EMPTY_STATE)
  })

  it('roundtrips a group pick', () => {
    const state: BracketState = {
      ...EMPTY_STATE,
      groups: {
        ...EMPTY_STATE.groups,
        A: { first: 'MEX', second: 'RSA', thirdRank: 3 },
      },
    }
    const decoded = decodePicks(encodePicks(state))
    expect(decoded!.groups.A).toEqual({ first: 'MEX', second: 'RSA', thirdRank: 3 })
  })

  it('roundtrips a match winner', () => {
    const state: BracketState = {
      ...EMPTY_STATE,
      matches: { ...EMPTY_STATE.matches, r32_m1: { winner: 'MEX' } },
    }
    const decoded = decodePicks(encodePicks(state))
    expect(decoded!.matches.r32_m1.winner).toBe('MEX')
  })

  it('returns null for invalid input', () => {
    expect(decodePicks('!!!invalid!!!')).toBeNull()
  })

  it('produces a string under 60 characters', () => {
    expect(encodePicks(EMPTY_STATE).length).toBeLessThan(60)
  })

  it('roundtrips full state with multiple picks', () => {
    const state: BracketState = {
      groups: {
        ...EMPTY_STATE.groups,
        A: { first: 'MEX', second: 'RSA', thirdRank: 1 },
        J: { first: 'ARG', second: 'ALG', thirdRank: 2 },
      },
      matches: {
        ...EMPTY_STATE.matches,
        r32_m1: { winner: 'MEX' },
        final: { winner: 'ARG' },
      },
    }
    const decoded = decodePicks(encodePicks(state))!
    expect(decoded.groups.A).toEqual({ first: 'MEX', second: 'RSA', thirdRank: 1 })
    expect(decoded.groups.J).toEqual({ first: 'ARG', second: 'ALG', thirdRank: 2 })
    expect(decoded.matches.r32_m1.winner).toBe('MEX')
    expect(decoded.matches.final.winner).toBe('ARG')
  })
})
