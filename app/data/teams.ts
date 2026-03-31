export interface Team {
  id: string        // FIFA 3-letter code or placeholder code
  name: string
  flagCode: string  // ISO 3166-1-alpha-2 lowercase, e.g. 'ar', 'gb-eng'
  group: string     // "A"–"L"
  placeholder?: boolean  // true for teams not yet confirmed
}

export const TEAMS: Team[] = [
  // Group A
  { id: 'MEX',  name: 'Mexico',              flagCode: 'mx',     group: 'A' },
  { id: 'RSA',  name: 'South Africa',        flagCode: 'za',     group: 'A' },
  { id: 'KOR',  name: 'South Korea',         flagCode: 'kr',     group: 'A' },
  { id: 'UPOD', name: 'UEFA PO-D Winner',    flagCode: 'un',     group: 'A', placeholder: true },
  // Group B
  { id: 'CAN',  name: 'Canada',              flagCode: 'ca',     group: 'B' },
  { id: 'SUI',  name: 'Switzerland',         flagCode: 'ch',     group: 'B' },
  { id: 'QAT',  name: 'Qatar',               flagCode: 'qa',     group: 'B' },
  { id: 'UPOA', name: 'UEFA PO-A Winner',    flagCode: 'un',     group: 'B', placeholder: true },
  // Group C
  { id: 'BRA',  name: 'Brazil',              flagCode: 'br',     group: 'C' },
  { id: 'SCO',  name: 'Scotland',            flagCode: 'gb-sct', group: 'C' },
  { id: 'MAR',  name: 'Morocco',             flagCode: 'ma',     group: 'C' },
  { id: 'HAI',  name: 'Haiti',               flagCode: 'ht',     group: 'C' },
  // Group D
  { id: 'USA',  name: 'United States',       flagCode: 'us',     group: 'D' },
  { id: 'PAR',  name: 'Paraguay',            flagCode: 'py',     group: 'D' },
  { id: 'AUS',  name: 'Australia',           flagCode: 'au',     group: 'D' },
  { id: 'UPOC', name: 'UEFA PO-C Winner',    flagCode: 'un',     group: 'D', placeholder: true },
  // Group E
  { id: 'GER',  name: 'Germany',             flagCode: 'de',     group: 'E' },
  { id: 'CUW',  name: 'Curaçao',             flagCode: 'cw',     group: 'E' },
  { id: 'CIV',  name: 'Ivory Coast',         flagCode: 'ci',     group: 'E' },
  { id: 'ECU',  name: 'Ecuador',             flagCode: 'ec',     group: 'E' },
  // Group F
  { id: 'NED',  name: 'Netherlands',         flagCode: 'nl',     group: 'F' },
  { id: 'JPN',  name: 'Japan',               flagCode: 'jp',     group: 'F' },
  { id: 'TUN',  name: 'Tunisia',             flagCode: 'tn',     group: 'F' },
  { id: 'UPOB', name: 'UEFA PO-B Winner',    flagCode: 'un',     group: 'F', placeholder: true },
  // Group G
  { id: 'BEL',  name: 'Belgium',             flagCode: 'be',     group: 'G' },
  { id: 'EGY',  name: 'Egypt',               flagCode: 'eg',     group: 'G' },
  { id: 'IRN',  name: 'Iran',                flagCode: 'ir',     group: 'G' },
  { id: 'NZL',  name: 'New Zealand',         flagCode: 'nz',     group: 'G' },
  // Group H
  { id: 'ESP',  name: 'Spain',               flagCode: 'es',     group: 'H' },
  { id: 'CPV',  name: 'Cape Verde',          flagCode: 'cv',     group: 'H' },
  { id: 'SAU',  name: 'Saudi Arabia',        flagCode: 'sa',     group: 'H' },
  { id: 'URU',  name: 'Uruguay',             flagCode: 'uy',     group: 'H' },
  // Group I
  { id: 'FRA',  name: 'France',              flagCode: 'fr',     group: 'I' },
  { id: 'SEN',  name: 'Senegal',             flagCode: 'sn',     group: 'I' },
  { id: 'NOR',  name: 'Norway',              flagCode: 'no',     group: 'I' },
  { id: 'IPO2', name: 'Inter-conf PO Winner 2', flagCode: 'un', group: 'I', placeholder: true },
  // Group J
  { id: 'ARG',  name: 'Argentina',           flagCode: 'ar',     group: 'J' },
  { id: 'ALG',  name: 'Algeria',             flagCode: 'dz',     group: 'J' },
  { id: 'AUT',  name: 'Austria',             flagCode: 'at',     group: 'J' },
  { id: 'JOR',  name: 'Jordan',              flagCode: 'jo',     group: 'J' },
  // Group K
  { id: 'POR',  name: 'Portugal',            flagCode: 'pt',     group: 'K' },
  { id: 'COL',  name: 'Colombia',            flagCode: 'co',     group: 'K' },
  { id: 'UZB',  name: 'Uzbekistan',          flagCode: 'uz',     group: 'K' },
  { id: 'IPO1', name: 'Inter-conf PO Winner 1', flagCode: 'un', group: 'K', placeholder: true },
  // Group L
  { id: 'ENG',  name: 'England',             flagCode: 'gb-eng', group: 'L' },
  { id: 'CRO',  name: 'Croatia',             flagCode: 'hr',     group: 'L' },
  { id: 'GHA',  name: 'Ghana',               flagCode: 'gh',     group: 'L' },
  { id: 'PAN',  name: 'Panama',              flagCode: 'pa',     group: 'L' },
]

export const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'] as const
export type GroupKey = typeof GROUPS[number]

export function getGroup(key: GroupKey): Team[] {
  return TEAMS.filter(t => t.group === key)
}

export function getTeamById(id: string): Team | undefined {
  return TEAMS.find(t => t.id === id)
}

export interface SeedSource {
  source: 'winner' | 'runner' | 'third'
  group: GroupKey
}

export interface R32Fixture {
  id: string
  home: SeedSource
  away: SeedSource
  bracket: 'left' | 'right'
}

// R32 seeding: 12 group winners + 12 runners-up + 8 best 3rd-place = 32 teams
// Pairings follow the official FIFA draw bracket — verify at:
// https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/bracket
export const R32_FIXTURES: R32Fixture[] = [
  { id: 'r32_m1',  home: { source: 'winner', group: 'A' }, away: { source: 'runner', group: 'B' }, bracket: 'left' },
  { id: 'r32_m2',  home: { source: 'winner', group: 'C' }, away: { source: 'runner', group: 'D' }, bracket: 'left' },
  { id: 'r32_m3',  home: { source: 'winner', group: 'E' }, away: { source: 'runner', group: 'F' }, bracket: 'left' },
  { id: 'r32_m4',  home: { source: 'winner', group: 'G' }, away: { source: 'runner', group: 'H' }, bracket: 'left' },
  { id: 'r32_m5',  home: { source: 'winner', group: 'B' }, away: { source: 'runner', group: 'A' }, bracket: 'left' },
  { id: 'r32_m6',  home: { source: 'winner', group: 'D' }, away: { source: 'runner', group: 'C' }, bracket: 'left' },
  { id: 'r32_m7',  home: { source: 'winner', group: 'F' }, away: { source: 'runner', group: 'E' }, bracket: 'left' },
  { id: 'r32_m8',  home: { source: 'winner', group: 'H' }, away: { source: 'runner', group: 'G' }, bracket: 'left' },
  { id: 'r32_m9',  home: { source: 'winner', group: 'I' }, away: { source: 'runner', group: 'J' }, bracket: 'right' },
  { id: 'r32_m10', home: { source: 'winner', group: 'K' }, away: { source: 'runner', group: 'L' }, bracket: 'right' },
  { id: 'r32_m11', home: { source: 'winner', group: 'J' }, away: { source: 'runner', group: 'I' }, bracket: 'right' },
  { id: 'r32_m12', home: { source: 'winner', group: 'L' }, away: { source: 'runner', group: 'K' }, bracket: 'right' },
  // Last 4 R32 slots seeded by best 3rd-place teams (group TBD at tournament time)
  { id: 'r32_m13', home: { source: 'third', group: 'A' }, away: { source: 'third', group: 'B' }, bracket: 'right' },
  { id: 'r32_m14', home: { source: 'third', group: 'C' }, away: { source: 'third', group: 'D' }, bracket: 'right' },
  { id: 'r32_m15', home: { source: 'third', group: 'E' }, away: { source: 'third', group: 'F' }, bracket: 'right' },
  { id: 'r32_m16', home: { source: 'third', group: 'G' }, away: { source: 'third', group: 'H' }, bracket: 'right' },
]

export const BRACKET_TREE = {
  r16_m1: ['r32_m1', 'r32_m2'],
  r16_m2: ['r32_m3', 'r32_m4'],
  r16_m3: ['r32_m5', 'r32_m6'],
  r16_m4: ['r32_m7', 'r32_m8'],
  r16_m5: ['r32_m9',  'r32_m10'],
  r16_m6: ['r32_m11', 'r32_m12'],
  r16_m7: ['r32_m13', 'r32_m14'],
  r16_m8: ['r32_m15', 'r32_m16'],
  qf_m1: ['r16_m1', 'r16_m2'],
  qf_m2: ['r16_m3', 'r16_m4'],
  qf_m3: ['r16_m5', 'r16_m6'],
  qf_m4: ['r16_m7', 'r16_m8'],
  sf_m1: ['qf_m1', 'qf_m2'],
  sf_m2: ['qf_m3', 'qf_m4'],
  final: ['sf_m1', 'sf_m2'],
  third_place: ['sf_m1', 'sf_m2'],
} as const

export type MatchId =
  | `r32_m${number}`
  | `r16_m${number}`
  | `qf_m${number}`
  | `sf_m${number}`
  | 'final'
  | 'third_place'

export const ALL_MATCH_IDS: MatchId[] = [
  'r32_m1','r32_m2','r32_m3','r32_m4','r32_m5','r32_m6','r32_m7','r32_m8',
  'r32_m9','r32_m10','r32_m11','r32_m12','r32_m13','r32_m14','r32_m15','r32_m16',
  'r16_m1','r16_m2','r16_m3','r16_m4','r16_m5','r16_m6','r16_m7','r16_m8',
  'qf_m1','qf_m2','qf_m3','qf_m4',
  'sf_m1','sf_m2',
  'final',
  'third_place',
]
