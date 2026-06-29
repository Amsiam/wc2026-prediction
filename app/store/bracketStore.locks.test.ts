import { describe, it, expect } from 'vitest'
import { createBracketStore } from './bracketStore'
import { CONFIRMED_MATCHES } from '../data/confirmed'

describe('bracketStore official knockout locks', () => {
  it('initializes locked winners from synced results', () => {
    const store = createBracketStore()
    for (const [matchId, winner] of Object.entries(CONFIRMED_MATCHES)) {
      expect(store.getState().matches[matchId as keyof typeof CONFIRMED_MATCHES]?.winner).toBe(winner)
    }
  })

  it('cannot change a locked match winner', () => {
    const locked = Object.entries(CONFIRMED_MATCHES)[0]
    if (!locked) return
    const [matchId, winner] = locked
    const store = createBracketStore()
    const other = winner === 'RSA' ? 'CAN' : 'RSA'
    store.getState().setMatchWinner(matchId as 'r32_m1', other)
    expect(store.getState().matches[matchId as 'r32_m1'].winner).toBe(winner)
  })

  it('re-applies locked winners after applyOfficialLocks', () => {
    const locked = Object.entries(CONFIRMED_MATCHES)[0]
    if (!locked) return
    const [matchId, winner] = locked
    const store = createBracketStore()
    store.setState({
      matches: {
        ...store.getState().matches,
        [matchId]: { winner: 'MEX' },
      },
    })
    store.getState().applyOfficialLocks()
    expect(store.getState().matches[matchId as 'r32_m1'].winner).toBe(winner)
  })
})
