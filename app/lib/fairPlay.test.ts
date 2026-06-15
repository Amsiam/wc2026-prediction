import { describe, it, expect } from 'vitest'
import { teamMatchConduct, totalConduct, disciplineFromEvents } from './fairPlay'

describe('fairPlay', () => {
  it('calculates FIFA conduct deductions', () => {
    expect(teamMatchConduct({ yellows: 2, red: 'none' })).toBe(-2)
    expect(teamMatchConduct({ yellows: 1, red: 'second_yellow' })).toBe(-4)
    expect(teamMatchConduct({ yellows: 0, red: 'direct' })).toBe(-4)
    expect(teamMatchConduct({ yellows: 0, red: 'yellow_and_direct' })).toBe(-5)
  })

  it('sums conduct across matches', () => {
    const total = totalConduct([
      { yellows: 1, red: 'none' },
      { yellows: 2, red: 'none' },
    ])
    expect(total).toBe(-3)
  })

  it('parses API card events', () => {
    const events = [
      { type: 'Card', detail: 'Yellow Card', team: { name: 'Japan' } },
      { type: 'Card', detail: 'Yellow Card', team: { name: 'Japan' } },
      { type: 'Card', detail: 'Red Card', team: { name: 'Japan' } },
      { type: 'Card', detail: 'Yellow Card', team: { name: 'Senegal' } },
    ]
    expect(disciplineFromEvents(events, 'Japan')).toEqual({ yellows: 1, red: 'second_yellow' })
    expect(disciplineFromEvents(events, 'Senegal')).toEqual({ yellows: 1, red: 'none' })
  })
})
