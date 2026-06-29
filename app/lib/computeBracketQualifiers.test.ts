import { describe, it, expect } from 'vitest'
import { LIVE_RESULTS } from '../data/liveResults'
import { AUTO_CONFIRMED } from '../data/autoConfirmed'
import { computeBracketQualifiers } from './computeBracketQualifiers'

describe('computeBracketQualifiers', () => {
  it('matches autoConfirmed groups from live results', () => {
    const { groups } = computeBracketQualifiers(
      LIVE_RESULTS.scores,
      LIVE_RESULTS.discipline,
      LIVE_RESULTS.teamConduct,
      { completeOnly: true },
    )
    expect(groups).toEqual(AUTO_CONFIRMED.groups)
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
