import { canonicalTeamName } from './standings'

/** Map openfootball / Wikipedia display names → schedule canonical names. */
const SOURCE_ALIASES: Record<string, string> = {
  'south korea': 'korea republic',
  'bosnia herzegovina': 'bosnia and herzegovina',
  'ivory coast': 'cote divoire',
  'iran': 'ir iran',
  'cape verde': 'cabo verde',
  'dr congo': 'congo dr',
  'turkey': 'turkiye',
  'czech republic': 'czechia',
}

export function sourceNameToCanonical(name: string): string {
  const n = canonicalTeamName(name)
  return SOURCE_ALIASES[n] ?? n
}
