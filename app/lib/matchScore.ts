/** Synced or official match score (90 min + optional pens). */
export interface MatchResult {
  home: number
  away: number
  pens?: { home: number; away: number }
}

export function formatMatchScore(score: MatchResult): string {
  if (score.pens != null && score.home === score.away) {
    return `${score.home}(${score.pens.home})–${score.away}(${score.pens.away})`
  }
  return `${score.home}–${score.away}`
}
