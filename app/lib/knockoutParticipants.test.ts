import { describe, it, expect } from 'vitest'
import { alignKnockoutScoresToSchedule } from './knockoutParticipants'

describe('alignKnockoutScoresToSchedule', () => {
  it('flips mis-oriented R32 score when winner is schedule away team', () => {
    const groups = {
      A: { first: 'MEX', second: 'RSA' },
      B: { first: 'SUI', second: 'CAN' },
    }
    const knockout = { r32_m1: 'CAN' }
    const scores = { 73: { home: 1, away: 0 } }

    expect(alignKnockoutScoresToSchedule(scores, groups, knockout)).toEqual({
      73: { home: 0, away: 1 },
    })
  })

  it('flips pen tallies when shootout winner is schedule away team', () => {
    const groups = {
      A: { first: 'MEX', second: 'RSA' },
      B: { first: 'SUI', second: 'CAN' },
    }
    const knockout = { r32_m1: 'CAN' }
    const scores = { 73: { home: 0, away: 0, pens: { home: 5, away: 4 } } }

    expect(alignKnockoutScoresToSchedule(scores, groups, knockout)).toEqual({
      73: { home: 0, away: 0, pens: { home: 4, away: 5 } },
    })
  })

  it('flips AET final score when winner is schedule home team', () => {
    const groups = {
      G: { first: 'BEL', second: 'EGY' },
      I: { first: 'FRA', second: 'NOR', third: 'SEN', thirdSlot: 'r32_m10' },
    }
    const knockout = { r32_m10: 'BEL' }
    const scores = { 82: { home: 2, away: 2, aet: { home: 2, away: 3 } } }

    expect(alignKnockoutScoresToSchedule(scores, groups, knockout)).toEqual({
      82: { home: 2, away: 2, aet: { home: 3, away: 2 } },
    })
  })
})
