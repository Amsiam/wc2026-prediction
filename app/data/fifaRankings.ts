/** FIFA/Coca-Cola Men's World Ranking (11 June 2026) — from Wikipedia group pages. */
export const FIFA_RANKINGS: Record<string, number> = {
  MEX: 14, RSA: 60, KOR: 25, CZE: 40,
  CAN: 30, BIH: 64, QAT: 56, SUI: 19,
  BRA: 6, SCO: 36, MAR: 11, HAI: 87,
  USA: 17, PAR: 41, AUS: 27, TUR: 22,
  GER: 10, CUW: 82, CIV: 33, ECU: 23,
  NED: 7, JPN: 18, SWE: 28, TUN: 41,
  BEL: 9, EGY: 29, IRN: 20, NZL: 85,
  ESP: 2, CPV: 67, SAU: 61, URU: 16,
  FRA: 3, SEN: 15, IRQ: 57, NOR: 31,
  ARG: 1, ALG: 28, AUT: 24, JOR: 63,
  POR: 5, COD: 46, UZB: 50, COL: 13,
  ENG: 4, CRO: 11, GHA: 73, PAN: 34,
}

/** Lower rank number = better team (matches FIFA.com tiebreak notes). */
export function compareFifaRanking(aTeamId: string, bTeamId: string): number {
  const ra = FIFA_RANKINGS[aTeamId] ?? 999
  const rb = FIFA_RANKINGS[bTeamId] ?? 999
  return ra - rb
}
