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
  { id: 'CZE',  name: 'Czech Republic',       flagCode: 'cz',     group: 'A' },
  // Group B
  { id: 'CAN',  name: 'Canada',              flagCode: 'ca',     group: 'B' },
  { id: 'SUI',  name: 'Switzerland',         flagCode: 'ch',     group: 'B' },
  { id: 'QAT',  name: 'Qatar',               flagCode: 'qa',     group: 'B' },
  { id: 'BIH',  name: 'Bosnia & Herzegovina', flagCode: 'ba',     group: 'B' },
  // Group C
  { id: 'BRA',  name: 'Brazil',              flagCode: 'br',     group: 'C' },
  { id: 'SCO',  name: 'Scotland',            flagCode: 'gb-sct', group: 'C' },
  { id: 'MAR',  name: 'Morocco',             flagCode: 'ma',     group: 'C' },
  { id: 'HAI',  name: 'Haiti',               flagCode: 'ht',     group: 'C' },
  // Group D
  { id: 'USA',  name: 'United States',       flagCode: 'us',     group: 'D' },
  { id: 'PAR',  name: 'Paraguay',            flagCode: 'py',     group: 'D' },
  { id: 'AUS',  name: 'Australia',           flagCode: 'au',     group: 'D' },
  { id: 'TUR',  name: 'Turkey',               flagCode: 'tr',     group: 'D' },
  // Group E
  { id: 'GER',  name: 'Germany',             flagCode: 'de',     group: 'E' },
  { id: 'CUW',  name: 'Curaçao',             flagCode: 'cw',     group: 'E' },
  { id: 'CIV',  name: 'Ivory Coast',         flagCode: 'ci',     group: 'E' },
  { id: 'ECU',  name: 'Ecuador',             flagCode: 'ec',     group: 'E' },
  // Group F
  { id: 'NED',  name: 'Netherlands',         flagCode: 'nl',     group: 'F' },
  { id: 'JPN',  name: 'Japan',               flagCode: 'jp',     group: 'F' },
  { id: 'TUN',  name: 'Tunisia',             flagCode: 'tn',     group: 'F' },
  { id: 'SWE',  name: 'Sweden',               flagCode: 'se',     group: 'F' },
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
  { id: 'IRQ',  name: 'Iraq',                 flagCode: 'iq',     group: 'I' },
  // Group J
  { id: 'ARG',  name: 'Argentina',           flagCode: 'ar',     group: 'J' },
  { id: 'ALG',  name: 'Algeria',             flagCode: 'dz',     group: 'J' },
  { id: 'AUT',  name: 'Austria',             flagCode: 'at',     group: 'J' },
  { id: 'JOR',  name: 'Jordan',              flagCode: 'jo',     group: 'J' },
  // Group K
  { id: 'POR',  name: 'Portugal',            flagCode: 'pt',     group: 'K' },
  { id: 'COL',  name: 'Colombia',            flagCode: 'co',     group: 'K' },
  { id: 'UZB',  name: 'Uzbekistan',          flagCode: 'uz',     group: 'K' },
  { id: 'COD',  name: 'DR Congo',              flagCode: 'cd',     group: 'K' },
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
  group?: GroupKey        // for winner/runner: the specific group
  groups?: GroupKey[]     // for third: the candidate groups
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
  // M73: 2A vs 2B
  { id: 'r32_m1',  home: { source: 'runner', group: 'A' }, away: { source: 'runner', group: 'B' }, bracket: 'left' },
  // M74: 1E vs 3(A/B/C/D/F)
  { id: 'r32_m2',  home: { source: 'winner', group: 'E' }, away: { source: 'third', groups: ['A','B','C','D','F'] }, bracket: 'left' },
  // M75: 1F vs 2C
  { id: 'r32_m3',  home: { source: 'winner', group: 'F' }, away: { source: 'runner', group: 'C' }, bracket: 'left' },
  // M76: 1C vs 2F
  { id: 'r32_m4',  home: { source: 'winner', group: 'C' }, away: { source: 'runner', group: 'F' }, bracket: 'left' },
  // M77: 1I vs 3(C/D/F/G/H)
  { id: 'r32_m5',  home: { source: 'winner', group: 'I' }, away: { source: 'third', groups: ['C','D','F','G','H'] }, bracket: 'left' },
  // M78: 2E vs 2I
  { id: 'r32_m6',  home: { source: 'runner', group: 'E' }, away: { source: 'runner', group: 'I' }, bracket: 'left' },
  // M79: 1A vs 3(C/E/F/H/I)
  { id: 'r32_m7',  home: { source: 'winner', group: 'A' }, away: { source: 'third', groups: ['C','E','F','H','I'] }, bracket: 'left' },
  // M80: 1L vs 3(E/H/I/J/K)
  { id: 'r32_m8',  home: { source: 'winner', group: 'L' }, away: { source: 'third', groups: ['E','H','I','J','K'] }, bracket: 'right' },
  // M81: 1D vs 3(B/E/F/I/J)
  { id: 'r32_m9',  home: { source: 'winner', group: 'D' }, away: { source: 'third', groups: ['B','E','F','I','J'] }, bracket: 'right' },
  // M82: 1G vs 3(A/E/H/I/J)
  { id: 'r32_m10', home: { source: 'winner', group: 'G' }, away: { source: 'third', groups: ['A','E','H','I','J'] }, bracket: 'right' },
  // M83: 2K vs 2L
  { id: 'r32_m11', home: { source: 'runner', group: 'K' }, away: { source: 'runner', group: 'L' }, bracket: 'right' },
  // M84: 1H vs 2J
  { id: 'r32_m12', home: { source: 'winner', group: 'H' }, away: { source: 'runner', group: 'J' }, bracket: 'right' },
  // M85: 1B vs 3(E/F/G/I/J)
  { id: 'r32_m13', home: { source: 'winner', group: 'B' }, away: { source: 'third', groups: ['E','F','G','I','J'] }, bracket: 'right' },
  // M86: 1J vs 2H
  { id: 'r32_m14', home: { source: 'winner', group: 'J' }, away: { source: 'runner', group: 'H' }, bracket: 'right' },
  // M87: 1K vs 3(D/E/I/J/L)
  { id: 'r32_m15', home: { source: 'winner', group: 'K' }, away: { source: 'third', groups: ['D','E','I','J','L'] }, bracket: 'right' },
  // M88: 2D vs 2G
  { id: 'r32_m16', home: { source: 'runner', group: 'D' }, away: { source: 'runner', group: 'G' }, bracket: 'right' },
]

export const BRACKET_TREE = {
  // R32 → R16
  r16_m1: ['r32_m2', 'r32_m5'],    // W74 vs W77
  r16_m2: ['r32_m1', 'r32_m3'],    // W73 vs W75
  r16_m3: ['r32_m4', 'r32_m6'],    // W76 vs W78
  r16_m4: ['r32_m7', 'r32_m8'],    // W79 vs W80
  r16_m5: ['r32_m11', 'r32_m12'],  // W83 vs W84
  r16_m6: ['r32_m9',  'r32_m10'],  // W81 vs W82
  r16_m7: ['r32_m14', 'r32_m16'],  // W86 vs W88
  r16_m8: ['r32_m13', 'r32_m15'],  // W85 vs W87
  // R16 → QF
  qf_m1: ['r16_m1', 'r16_m2'],    // W89 vs W90
  qf_m2: ['r16_m5', 'r16_m6'],    // W93 vs W94
  qf_m3: ['r16_m3', 'r16_m4'],    // W91 vs W92
  qf_m4: ['r16_m7', 'r16_m8'],    // W95 vs W96
  // QF → SF
  sf_m1: ['qf_m1', 'qf_m2'],      // W97 vs W98
  sf_m2: ['qf_m3', 'qf_m4'],      // W99 vs W100
  // SF → Final & 3rd place
  final:       ['sf_m1', 'sf_m2'],
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
