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
})
