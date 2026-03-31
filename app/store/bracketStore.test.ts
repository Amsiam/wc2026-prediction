import { describe, it, expect, beforeEach } from 'vitest'
import { createBracketStore } from './bracketStore'

describe('bracketStore', () => {
  let store: ReturnType<typeof createBracketStore>

  beforeEach(() => {
    store = createBracketStore()
  })

  it('starts with all picks null', () => {
    const s = store.getState()
    expect(s.groups.A.first).toBeNull()
    expect(s.matches.final.winner).toBeNull()
  })

  it('setGroupFirst sets first pick', () => {
    store.getState().setGroupFirst('A', 'MEX')
    expect(store.getState().groups.A.first).toBe('MEX')
  })

  it('setGroupFirst to null clears second too', () => {
    store.getState().setGroupFirst('A', 'MEX')
    store.getState().setGroupSecond('A', 'RSA')
    store.getState().setGroupFirst('A', null)
    expect(store.getState().groups.A.second).toBeNull()
  })

  it('setMatchWinner sets a knockout winner', () => {
    store.getState().setMatchWinner('r32_m1', 'MEX')
    expect(store.getState().matches.r32_m1.winner).toBe('MEX')
  })

  it('backfillPath sets winner in all prior rounds on the path', () => {
    // Selecting ARG as Final winner should also fill sf_m1 (or sf_m2)
    store.getState().backfillPath('final', 'ARG', 'home')
    const s = store.getState()
    expect(s.matches.final.winner).toBe('ARG')
    // sf_m1 is 'home' side of final
    expect(s.matches.sf_m1.winner).toBe('ARG')
    // qf_m1 is 'home' side of sf_m1
    expect(s.matches.qf_m1.winner).toBe('ARG')
  })

  it('clearDownstream removes picks in rounds above the changed match', () => {
    store.getState().setMatchWinner('r32_m1', 'MEX')
    store.getState().setMatchWinner('r16_m2', 'MEX')
    store.getState().clearDownstream('r32_m1')
    expect(store.getState().matches.r16_m2.winner).toBeNull()
  })

  it('setThirdRank sets rank on group', () => {
    store.getState().setThirdRank('A', 5)
    expect(store.getState().groups.A.thirdRank).toBe(5)
  })
})
