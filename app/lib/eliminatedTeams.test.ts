import { describe, expect, it } from 'vitest'
import { computeEliminatedTeamIds } from './eliminatedTeams'
import { LIVE_RESULTS } from '../data/liveResults'

describe('computeEliminatedTeamIds', () => {
  it('marks group-stage losers and knockout losers from live results', () => {
    const eliminated = computeEliminatedTeamIds({
      scores: LIVE_RESULTS.scores,
      discipline: LIVE_RESULTS.discipline,
      teamConduct: LIVE_RESULTS.teamConduct,
      knockout: LIVE_RESULTS.knockout,
    })

    // Group A: MEX and RSA advanced from group; KOR and CZE did not
    expect(eliminated.has('KOR')).toBe(true)
    expect(eliminated.has('CZE')).toBe(true)
    expect(eliminated.has('MEX')).toBe(false)

    // RSA lost R32 M73 (2A vs 2B) to CAN
    expect(eliminated.has('RSA')).toBe(true)
    expect(eliminated.has('CAN')).toBe(false)

    // JPN lost R32 M76 (1C vs 2F) to BRA
    expect(eliminated.has('JPN')).toBe(true)
    expect(eliminated.has('BRA')).toBe(false)
  })
})
