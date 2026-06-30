/** Synced or official match score (90 min + optional pens). */
export interface MatchResult {
  home: number
  away: number
  pens?: { home: number; away: number }
}

export function formatMatchScore(score: MatchResult): string {
  const ft = `${score.home}–${score.away}`
  if (score.pens != null && score.home === score.away) {
    return `${ft} (${score.pens.home}–${score.pens.away} pens)`
  }
  return ft
}
