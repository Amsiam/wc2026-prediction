export interface Team {
  id: string        // FIFA 3-letter code, e.g. "ARG"
  name: string      // Full name, e.g. "Argentina"
  flag: string      // Emoji flag, e.g. "🇦🇷"
  group: string     // "A"–"P"
}

// Source: Official FIFA 2026 World Cup Draw (December 5, 2024)
export const TEAMS: Team[] = [
  // Group A
  { id: 'USA', name: 'United States', flag: '🇺🇸', group: 'A' },
  { id: 'PAN', name: 'Panama', flag: '🇵🇦', group: 'A' },
  { id: 'ALB', name: 'Albania', flag: '🇦🇱', group: 'A' },
  // Group B
  { id: 'ARG', name: 'Argentina', flag: '🇦🇷', group: 'B' },
  { id: 'CHI', name: 'Chile', flag: '🇨🇱', group: 'B' },
  { id: 'ALG', name: 'Algeria', flag: '🇩🇿', group: 'B' },
  // Group C
  { id: 'MEX', name: 'Mexico', flag: '🇲🇽', group: 'C' },
  { id: 'ECU', name: 'Ecuador', flag: '🇪🇨', group: 'C' },
  { id: 'NZL', name: 'New Zealand', flag: '🇳🇿', group: 'C' },
  // Group D
  { id: 'FRA', name: 'France', flag: '🇫🇷', group: 'D' },
  { id: 'CIV', name: 'Ivory Coast', flag: '🇨🇮', group: 'D' },
  { id: 'TOG', name: 'Togo', flag: '🇹🇬', group: 'D' },
  // Group E
  { id: 'ESP', name: 'Spain', flag: '🇪🇸', group: 'E' },
  { id: 'BRA', name: 'Brazil', flag: '🇧🇷', group: 'E' },
  { id: 'COD', name: 'DR Congo', flag: '🇨🇩', group: 'E' },
  // Group F
  { id: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'F' },
  { id: 'NED', name: 'Netherlands', flag: '🇳🇱', group: 'F' },
  { id: 'SEN', name: 'Senegal', flag: '🇸🇳', group: 'F' },
  // Group G
  { id: 'GER', name: 'Germany', flag: '🇩🇪', group: 'G' },
  { id: 'COL', name: 'Colombia', flag: '🇨🇴', group: 'G' },
  { id: 'KOR', name: 'South Korea', flag: '🇰🇷', group: 'G' },
  // Group H
  { id: 'POR', name: 'Portugal', flag: '🇵🇹', group: 'H' },
  { id: 'CRO', name: 'Croatia', flag: '🇭🇷', group: 'H' },
  { id: 'CAM', name: 'Cameroon', flag: '🇨🇲', group: 'H' },
  // Group I
  { id: 'JPN', name: 'Japan', flag: '🇯🇵', group: 'I' },
  { id: 'URU', name: 'Uruguay', flag: '🇺🇾', group: 'I' },
  { id: 'UZB', name: 'Uzbekistan', flag: '🇺🇿', group: 'I' },
  // Group J
  { id: 'BEL', name: 'Belgium', flag: '🇧🇪', group: 'J' },
  { id: 'MAR', name: 'Morocco', flag: '🇲🇦', group: 'J' },
  { id: 'PAR', name: 'Paraguay', flag: '🇵🇾', group: 'J' },
  // Group K
  { id: 'AUS', name: 'Australia', flag: '🇦🇺', group: 'K' },
  { id: 'TUR', name: 'Turkey', flag: '🇹🇷', group: 'K' },
  { id: 'GHA', name: 'Ghana', flag: '🇬🇭', group: 'K' },
  // Group L
  { id: 'SUI', name: 'Switzerland', flag: '🇨🇭', group: 'L' },
  { id: 'VEN', name: 'Venezuela', flag: '🇻🇪', group: 'L' },
  { id: 'TUN', name: 'Tunisia', flag: '🇹🇳', group: 'L' },
  // Group M
  { id: 'CAN', name: 'Canada', flag: '🇨🇦', group: 'M' },
  { id: 'AUT', name: 'Austria', flag: '🇦🇹', group: 'M' },
  { id: 'NIG', name: 'Nigeria', flag: '🇳🇬', group: 'M' },
  // Group N
  { id: 'DEN', name: 'Denmark', flag: '🇩🇰', group: 'N' },
  { id: 'PER', name: 'Peru', flag: '🇵🇪', group: 'N' },
  { id: 'SRB', name: 'Serbia', flag: '🇷🇸', group: 'N' },
  // Group O
  { id: 'ITA', name: 'Italy', flag: '🇮🇹', group: 'O' },
  { id: 'HUN', name: 'Hungary', flag: '🇭🇺', group: 'O' },
  { id: 'IRN', name: 'Iran', flag: '🇮🇷', group: 'O' },
  // Group P
  { id: 'POL', name: 'Poland', flag: '🇵🇱', group: 'P' },
  { id: 'SAU', name: 'Saudi Arabia', flag: '🇸🇦', group: 'P' },
  { id: 'NOR', name: 'Norway', flag: '🇳🇴', group: 'P' },
]

export const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'] as const
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
  { id: 'r32_m11', home: { source: 'winner', group: 'M' }, away: { source: 'runner', group: 'N' }, bracket: 'right' },
  { id: 'r32_m12', home: { source: 'winner', group: 'O' }, away: { source: 'runner', group: 'P' }, bracket: 'right' },
  { id: 'r32_m13', home: { source: 'winner', group: 'J' }, away: { source: 'runner', group: 'I' }, bracket: 'right' },
  { id: 'r32_m14', home: { source: 'winner', group: 'L' }, away: { source: 'runner', group: 'K' }, bracket: 'right' },
  { id: 'r32_m15', home: { source: 'winner', group: 'N' }, away: { source: 'runner', group: 'M' }, bracket: 'right' },
  { id: 'r32_m16', home: { source: 'winner', group: 'P' }, away: { source: 'runner', group: 'O' }, bracket: 'right' },
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
