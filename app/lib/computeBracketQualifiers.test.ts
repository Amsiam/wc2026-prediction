import { describe, it, expect } from 'vitest'
import { LIVE_RESULTS } from '../data/liveResults'
import { computeBracketQualifiers } from './computeBracketQualifiers'

describe('computeBracketQualifiers', () => {
  it('derives complete group qualifiers from live results', () => {
    const { groups } = computeBracketQualifiers(
      LIVE_RESULTS.scores,
      LIVE_RESULTS.discipline,
      LIVE_RESULTS.teamConduct,
      { completeOnly: true },
    )
    expect(Object.keys(groups)).toHaveLength(12)
    expect(groups.A).toEqual({ first: 'MEX', second: 'RSA' })
    expect(groups.B?.third).toBe('BIH')
  })

  it('assigns third slots for exactly 8 qualifying groups', () => {
    const { groups } = computeBracketQualifiers(
      LIVE_RESULTS.scores,
      LIVE_RESULTS.discipline,
      LIVE_RESULTS.teamConduct,
      { completeOnly: true },
    )
    const withThird = Object.values(groups).filter(g => g?.third)
    expect(withThird).toHaveLength(8)
    for (const g of withThird) {
      expect(g!.thirdSlot).toBeTruthy()
    }
  })
})
