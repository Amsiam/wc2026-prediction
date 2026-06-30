import { describe, it, expect } from 'vitest'
import { orderScheduleDateGroups, sortMatchesByKickoff } from './scheduleOrder'

describe('orderScheduleDateGroups', () => {
  const tz = 'UTC'
  const now = new Date('2026-06-30T12:00:00Z')

  it('puts today and future first ascending, then past descending', () => {
    const groups = [
      { label: 'June 28', sortKey: '2026-06-28', items: [] },
      { label: 'July 2', sortKey: '2026-07-02', items: [] },
      { label: 'June 30', sortKey: '2026-06-30', items: [] },
      { label: 'June 29', sortKey: '2026-06-29', items: [] },
      { label: 'July 1', sortKey: '2026-07-01', items: [] },
    ]

    expect(orderScheduleDateGroups(groups, tz, now).map(g => g.sortKey)).toEqual([
      '2026-06-30',
      '2026-07-01',
      '2026-07-02',
      '2026-06-29',
      '2026-06-28',
    ])
  })
})

describe('sortMatchesByKickoff', () => {
  it('orders by kickoff time, not match number', () => {
    const matches = [
      { matchNumber: 49, utcDate: '2026-06-24T22:00:00Z' },
      { matchNumber: 50, utcDate: '2026-06-24T22:00:00Z' },
      { matchNumber: 51, utcDate: '2026-06-24T19:00:00Z' },
      { matchNumber: 52, utcDate: '2026-06-24T19:00:00Z' },
    ]

    expect(sortMatchesByKickoff(matches).map(m => m.matchNumber)).toEqual([51, 52, 49, 50])
  })
})
