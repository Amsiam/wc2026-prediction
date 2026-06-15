/** FIFA fair-play red-card categories for a single team in one match. */
export type RedCardType = 'none' | 'second_yellow' | 'direct' | 'yellow_and_direct'

export interface TeamDiscipline {
  yellows: number
  red: RedCardType
}

export interface MatchDiscipline {
  home: TeamDiscipline
  away: TeamDiscipline
}

export const EMPTY_DISCIPLINE: TeamDiscipline = { yellows: 0, red: 'none' }

export const EMPTY_MATCH_DISCIPLINE: MatchDiscipline = {
  home: { ...EMPTY_DISCIPLINE },
  away: { ...EMPTY_DISCIPLINE },
}

/** FIFA conduct deduction for one team in one match (higher = better discipline). */
export function teamMatchConduct(d: TeamDiscipline): number {
  const yellowDeduction = Math.max(0, d.yellows)
  const redDeduction =
    d.red === 'second_yellow' ? 3 :
    d.red === 'direct' ? 4 :
    d.red === 'yellow_and_direct' ? 5 : 0
  return -(yellowDeduction + redDeduction)
}

/** Sum conduct across matches for a team (higher = better). */
export function totalConduct(entries: TeamDiscipline[]): number {
  return entries.reduce((sum, d) => sum + teamMatchConduct(d), 0)
}

/** Parse API-Football card events into discipline for one team. */
export function disciplineFromEvents(
  events: Array<{ type: string; detail: string; team: { name: string } }>,
  teamName: string,
): TeamDiscipline {
  const norm = (s: string) => s.toLowerCase().trim()
  const target = norm(teamName)
  let yellows = 0
  let sawRed = false
  let redDetail = ''

  for (const e of events) {
    if (norm(e.team.name) !== target) continue
    const type = e.type.toLowerCase()
    const detail = (e.detail ?? '').toLowerCase()

    if (type === 'card') {
      if (detail.includes('yellow')) yellows++
      else if (detail.includes('red')) {
        sawRed = true
        redDetail = detail
      }
    }
  }

  if (!sawRed) return { yellows, red: 'none' }

  if (redDetail.includes('second') || yellows >= 2) {
    return { yellows: Math.max(0, yellows - 1), red: 'second_yellow' }
  }
  if (yellows > 0) return { yellows, red: 'yellow_and_direct' }
  return { yellows: 0, red: 'direct' }
}
