import { describe, it, expect } from 'vitest'
import { computeStandings } from './standings'
import type { GroupDiscipline } from './standings'

describe('standings fair play', () => {
  it('tracks fair play conduct per team', () => {
    const scores = { 1: { home: 1, away: 0 } }
    const discipline: GroupDiscipline = {
      1: {
        home: { yellows: 2, red: 'none' },
        away: { yellows: 0, red: 'none' },
      },
    }
    const standings = computeStandings('A', scores, {}, discipline)
    expect(standings.find(s => s.teamId === 'MEX')?.fairPlay).toBe(-2)
    expect(standings.find(s => s.teamId === 'RSA')?.fairPlay).toBe(0)
  })

  it('ranks teams with equal pts/gd/gf by fair play', () => {
    const scores = {
      1: { home: 1, away: 1 },
      2: { home: 1, away: 1 },
      25: { home: 1, away: 1 },
      28: { home: 1, away: 1 },
      51: { home: 1, away: 1 },
      52: { home: 1, away: 1 },
    }
    const discipline: GroupDiscipline = {
      1: {
        home: { yellows: 3, red: 'none' },
        away: { yellows: 0, red: 'none' },
      },
    }
    const standings = computeStandings('A', scores, {}, discipline)
    const mexIdx = standings.findIndex(s => s.teamId === 'MEX')
    const korIdx = standings.findIndex(s => s.teamId === 'KOR')
    expect(korIdx).toBeLessThan(mexIdx)
  })

  it('uses teamConduct override when provided', () => {
    const scores = {
      1: { home: 1, away: 1 },
      2: { home: 1, away: 1 },
      25: { home: 1, away: 1 },
      28: { home: 1, away: 1 },
      51: { home: 1, away: 1 },
      52: { home: 1, away: 1 },
    }
    const standings = computeStandings('A', scores, {}, {}, { MEX: -1, RSA: -5 })
    const mexIdx = standings.findIndex(s => s.teamId === 'MEX')
    const rsaIdx = standings.findIndex(s => s.teamId === 'RSA')
    expect(mexIdx).toBeLessThan(rsaIdx)
    expect(standings.find(s => s.teamId === 'MEX')?.fairPlay).toBe(-1)
  })

  it('matches FIFA Group B order after two draws (h2h then fair play)', () => {
    const scores = {
      3: { home: 1, away: 1 },  // Canada v Bosnia
      8: { home: 1, away: 1 },  // Qatar v Switzerland
    }
    const conduct = { SUI: -1, CAN: -2, QAT: -2, BIH: -3 }
    const standings = computeStandings('B', scores, {}, {}, conduct)
    expect(standings.map(s => s.teamId)).toEqual(['SUI', 'CAN', 'QAT', 'BIH'])
  })
})
