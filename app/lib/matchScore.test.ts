import { describe, it, expect } from 'vitest'
import { formatMatchScore } from './matchScore'

describe('formatMatchScore', () => {
  it('formats full-time only', () => {
    expect(formatMatchScore({ home: 2, away: 1 })).toBe('2–1')
  })

  it('shows pen tallies inline when full time is a draw', () => {
    expect(formatMatchScore({
      home: 1,
      away: 1,
      pens: { home: 2, away: 3 },
    })).toBe('1(2)–1(3)')
  })

  it('ignores pens when there was a winner in normal time', () => {
    expect(formatMatchScore({
      home: 1,
      away: 0,
      pens: { home: 0, away: 0 },
    })).toBe('1–0')
  })
})
