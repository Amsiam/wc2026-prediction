export interface DateGroup<T> {
  label: string
  sortKey: string
  items: T[]
}

export interface KickoffSortable {
  utcDate: string
  matchNumber: number
}

export function compareByKickoff(a: KickoffSortable, b: KickoffSortable): number {
  const byTime = Date.parse(a.utcDate) - Date.parse(b.utcDate)
  return byTime !== 0 ? byTime : a.matchNumber - b.matchNumber
}

export function sortMatchesByKickoff<T extends KickoffSortable>(matches: T[]): T[] {
  return [...matches].sort(compareByKickoff)
}

export function dateSortKey(utcDate: string, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: tz,
  }).format(new Date(utcDate))
}

export function todaySortKey(tz: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: tz,
  }).format(now)
}

/** Today and future ascending, then past dates descending. */
export function orderScheduleDateGroups<T>(
  groups: DateGroup<T>[],
  tz: string,
  now = new Date(),
): DateGroup<T>[] {
  const today = todaySortKey(tz, now)
  const upcoming = groups
    .filter(g => g.sortKey >= today)
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
  const past = groups
    .filter(g => g.sortKey < today)
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
  return [...upcoming, ...past]
}
