/** Synced or official match score (90 min + optional AET / pens). */
export interface MatchResult {
  home: number
  away: number
  /** Cumulative score after extra time when FT was level. */
  aet?: { home: number; away: number }
  pens?: { home: number; away: number }
}

export function formatMatchScore(score: MatchResult): string {
  if (score.pens != null && score.home === score.away) {
    return `${score.home}(${score.pens.home})–${score.away}(${score.pens.away})`
  }
  if (score.aet != null && score.home === score.away) {
    return `${score.home}[${score.aet.home}]–${score.away}[${score.aet.away}]`
  }
  return `${score.home}–${score.away}`
}

export function formatTeamMatchScore(score: MatchResult, side: 'home' | 'away'): string {
  const ft = side === 'home' ? score.home : score.away
  if (score.pens != null && score.home === score.away) {
    const pens = side === 'home' ? score.pens.home : score.pens.away
    return `${ft}(${pens})`
  }
  if (score.aet != null && score.home === score.away) {
    const aet = side === 'home' ? score.aet.home : score.aet.away
    return `${ft}[${aet}]`
  }
  return String(ft)
}
