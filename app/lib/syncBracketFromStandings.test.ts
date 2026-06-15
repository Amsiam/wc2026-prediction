import { describe, it, expect, beforeEach } from 'vitest'
import { bracketStore } from '../store/bracketStore'
import { groupScoreStore } from '../store/groupScoreStore'
import { EMPTY_STATE } from './encoding'
import { syncBracketFromStandings } from './syncBracketFromStandings'

beforeEach(() => {
  bracketStore.getState().loadState(EMPTY_STATE)
  groupScoreStore.setState({
    scores: {},
    discipline: {},
    teamConduct: {},
    overrides: {},
    activeGroupModal: null,
  })
})

describe('syncBracketFromStandings', () => {
  it('fills group B bracket from partial standings (FIFA order)', () => {
    groupScoreStore.setState({
      scores: {
        3: { home: 1, away: 1 },
        8: { home: 1, away: 1 },
      },
      teamConduct: { SUI: -1, CAN: -2, QAT: -2, BIH: -3 },
    })

    syncBracketFromStandings()

    const b = bracketStore.getState().groups.B
    expect(b.first).toBe('SUI')
    expect(b.second).toBe('CAN')
    expect(b.third).toBe('QAT')
  })

  it('does not touch groups without played matches', () => {
    groupScoreStore.setState({
      scores: { 3: { home: 1, away: 1 }, 8: { home: 1, away: 1 } },
    })
    bracketStore.getState().setGroupFirst('D', 'USA')

    syncBracketFromStandings()

    expect(bracketStore.getState().groups.D.first).toBe('USA')
  })
})
