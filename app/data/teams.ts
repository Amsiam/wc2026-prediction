export interface Team {
  id: string        // FIFA 3-letter code or placeholder code
  name: string
  flag: string      // emoji flag
  group: string     // "A"–"L"
  placeholder?: boolean  // true for teams not yet confirmed
}

export const TEAMS: Team[] = [
  // Group A
  { id: 'MEX', name: 'Mexico',       flag: '🇲🇽', group: 'A' },
  { id: 'RSA', name: 'South Africa', flag: '🇿🇦', group: 'A' },
  { id: 'KOR', name: 'South Korea',  flag: '🇰🇷', group: 'A' },
  { id: 'UPOD', name: 'UEFA PO-D Winner', flag: '🏴', group: 'A', placeholder: true },
  // Group B
  { id: 'CAN', name: 'Canada',      flag: '🇨🇦', group: 'B' },
  { id: 'SUI', name: 'Switzerland', flag: '🇨🇭', group: 'B' },
  { id: 'QAT', name: 'Qatar',       flag: '🇶🇦', group: 'B' },
  { id: 'UPOA', name: 'UEFA PO-A Winner', flag: '🏴', group: 'B', placeholder: true },
  // Group C
  { id: 'BRA', name: 'Brazil',   flag: '🇧🇷', group: 'C' },
  { id: 'SCO', name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C' },
  { id: 'MAR', name: 'Morocco',  flag: '🇲🇦', group: 'C' },
  { id: 'HAI', name: 'Haiti',    flag: '🇭🇹', group: 'C' },
  // Group D
  { id: 'USA', name: 'United States', flag: '🇺🇸', group: 'D' },
  { id: 'PAR', name: 'Paraguay',     flag: '🇵🇾', group: 'D' },
  { id: 'AUS', name: 'Australia',    flag: '🇦🇺', group: 'D' },
  { id: 'UPOC', name: 'UEFA PO-C Winner', flag: '🏴', group: 'D', placeholder: true },
  // Group E
  { id: 'GER', name: 'Germany',     flag: '🇩🇪', group: 'E' },
  { id: 'CUW', name: 'Curaçao',     flag: '🇨🇼', group: 'E' },
  { id: 'CIV', name: 'Ivory Coast', flag: '🇨🇮', group: 'E' },
  { id: 'ECU', name: 'Ecuador',     flag: '🇪🇨', group: 'E' },
  // Group F
  { id: 'NED', name: 'Netherlands', flag: '🇳🇱', group: 'F' },
  { id: 'JPN', name: 'Japan',       flag: '🇯🇵', group: 'F' },
  { id: 'TUN', name: 'Tunisia',     flag: '🇹🇳', group: 'F' },
  { id: 'UPOB', name: 'UEFA PO-B Winner', flag: '🏴', group: 'F', placeholder: true },
  // Group G
  { id: 'BEL', name: 'Belgium',     flag: '🇧🇪', group: 'G' },
  { id: 'EGY', name: 'Egypt',       flag: '🇪🇬', group: 'G' },
  { id: 'IRN', name: 'Iran',        flag: '🇮🇷', group: 'G' },
  { id: 'NZL', name: 'New Zealand', flag: '🇳🇿', group: 'G' },
  // Group H
  { id: 'ESP', name: 'Spain',       flag: '🇪🇸', group: 'H' },
  { id: 'CPV', name: 'Cape Verde',  flag: '🇨🇻', group: 'H' },
  { id: 'SAU', name: 'Saudi Arabia',flag: '🇸🇦', group: 'H' },
  { id: 'URU', name: 'Uruguay',     flag: '🇺🇾', group: 'H' },
  // Group I
  { id: 'FRA', name: 'France',   flag: '🇫🇷', group: 'I' },
  { id: 'SEN', name: 'Senegal',  flag: '🇸🇳', group: 'I' },
  { id: 'NOR', name: 'Norway',   flag: '🇳🇴', group: 'I' },
  { id: 'IPO2', name: 'Inter-conf PO Winner 2', flag: '🏴', group: 'I', placeholder: true },
  // Group J
  { id: 'ARG', name: 'Argentina', flag: '🇦🇷', group: 'J' },
  { id: 'ALG', name: 'Algeria',   flag: '🇩🇿', group: 'J' },
  { id: 'AUT', name: 'Austria',   flag: '🇦🇹', group: 'J' },
  { id: 'JOR', name: 'Jordan',    flag: '🇯🇴', group: 'J' },
  // Group K
  { id: 'POR', name: 'Portugal',   flag: '🇵🇹', group: 'K' },
  { id: 'COL', name: 'Colombia',   flag: '🇨🇴', group: 'K' },
  { id: 'UZB', name: 'Uzbekistan', flag: '🇺🇿', group: 'K' },
  { id: 'IPO1', name: 'Inter-conf PO Winner 1', flag: '🏴', group: 'K', placeholder: true },
  // Group L
  { id: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L' },
  { id: 'CRO', name: 'Croatia', flag: '🇭🇷', group: 'L' },
  { id: 'GHA', name: 'Ghana',   flag: '🇬🇭', group: 'L' },
  { id: 'PAN', name: 'Panama',  flag: '🇵🇦', group: 'L' },
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
