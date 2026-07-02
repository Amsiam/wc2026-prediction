import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useStore } from 'zustand'
import { bracketStore } from '../store/bracketStore'
import { groupScoreStore } from '../store/groupScoreStore'
import { SCHEDULE, type ScheduleMatch } from '../data/schedule'
import { formatMatchScore } from '../lib/matchScore'
import { useOfficialMatchResult } from '../lib/runtimeResults'
import { useResultsSync } from '../hooks/useResultsSync'
import { SyncResultsButton } from '../components/SyncResultsButton'
import { resolveScheduleTeam, type ResolvedTeam } from '../lib/scheduleTeams'
import { dateSortKey, orderScheduleDateGroups, sortMatchesByKickoff, type DateGroup } from '../lib/scheduleOrder'

function TeamLabel({ team }: { team: ResolvedTeam }) {
  if (!team.known) return <span className="text-gray-500 italic">{team.name}</span>
  return (
    <span className="flex items-center gap-1.5">
      {team.flagCode && <span className={`fi fi-${team.flagCode}`} style={{ fontSize: '0.9em' }} />}
      <span className="font-medium">{team.name}</span>
    </span>
  )
}

const ALL_TIMEZONES: string[] = Intl.supportedValuesOf('timeZone')

function tzOffset(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' })
      .formatToParts(new Date())
    const off = parts.find(p => p.type === 'timeZoneName')?.value ?? ''
    return off
  } catch { return '' }
}

function TzPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen]     = useState(false)
  const [query, setQuery]   = useState('')
  const ref                 = useRef<HTMLDivElement>(null)
  const inputRef            = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return q ? ALL_TIMEZONES.filter(tz => tz.toLowerCase().includes(q)) : ALL_TIMEZONES
  }, [query])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (open) { setQuery(''); inputRef.current?.focus() }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 flex items-center gap-2 min-w-0 max-w-48"
      >
        <span className="flex-1 text-left truncate">{value.replace('_', ' ')}</span>
        <span className="text-gray-500 text-xs">{tzOffset(value)}</span>
        <span className="text-gray-500">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-72 max-w-[calc(100vw-2rem)]">
          <div className="p-2 border-b border-gray-800">
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search timezone…"
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white placeholder-gray-500 outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">No results</div>
            )}
            {filtered.map(tz => (
              <button
                key={tz}
                onClick={() => { onChange(tz); setOpen(false) }}
                className={`w-full text-left px-3 py-1.5 text-sm flex justify-between items-center hover:bg-gray-800 ${tz === value ? 'text-green-400' : 'text-gray-200'}`}
              >
                <span>{tz.replace(/_/g, ' ')}</span>
                <span className="text-xs text-gray-500 ml-2 shrink-0">{tzOffset(tz)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone

function formatTime(utcDate: string, tz: string): string {
  return new Date(utcDate).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    timeZone: tz,
  })
}

function getDateKey(utcDate: string, tz: string): string {
  return new Date(utcDate).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: tz,
  })
}

function groupByDate(matches: ScheduleMatch[], tz: string): DateGroup<ScheduleMatch>[] {
  const map = new Map<string, DateGroup<ScheduleMatch>>()
  for (const match of matches) {
    const sortKey = dateSortKey(match.utcDate, tz)
    const label = getDateKey(match.utcDate, tz)
    const existing = map.get(sortKey)
    if (existing) {
      existing.items.push(match)
    } else {
      map.set(sortKey, { label, sortKey, items: [match] })
    }
  }
  for (const group of map.values()) {
    group.items = sortMatchesByKickoff(group.items)
  }
  return orderScheduleDateGroups([...map.values()], tz)
}

const ROUND_COLORS: Record<string, string> = {
  'Group Stage':  'text-blue-400',
  'Round of 32':  'text-purple-400',
  'Round of 16':  'text-orange-400',
  'Quarterfinal': 'text-yellow-400',
  'Semifinal':    'text-red-400',
  '3rd Place':    'text-green-400',
  'Final':        'text-yellow-300',
}

const TZ_STORAGE_KEY = 'wc2026_tz'

function ScheduleMatchRow({
  match,
  home,
  away,
  tz,
}: {
  match: ScheduleMatch
  home: ResolvedTeam
  away: ResolvedTeam
  tz: string
}) {
  const score = useOfficialMatchResult(match.matchNumber)
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:py-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-gray-500 shrink-0">M{match.matchNumber}</span>
        <span className={`text-xs font-medium shrink-0 ${ROUND_COLORS[match.round] ?? 'text-gray-400'}`}>
          {match.group ? `Grp ${match.group}` : match.round.replace('Round of ', 'R')}
        </span>
        <span className="text-sm flex items-center gap-1 min-w-0 flex-1">
          <TeamLabel team={home} />
          {score ? (
            <span className="text-xs font-mono text-green-400 mx-1 shrink-0">
              {formatMatchScore(score)}
            </span>
          ) : (
            <span className="text-gray-500 mx-0.5 shrink-0">vs</span>
          )}
          <TeamLabel team={away} />
        </span>
      </div>
      <div className="flex items-center gap-2 sm:ml-auto sm:text-right sm:flex-col sm:items-end sm:gap-0">
        <span className="text-xs text-gray-200">{formatTime(match.utcDate, tz)}</span>
        <span className="text-xs text-gray-500">{match.city}</span>
      </div>
    </div>
  )
}

function SchedulePage() {
  useResultsSync()
  const groups    = useStore(bracketStore,    s => s.groups)
  const matches   = useStore(bracketStore,    s => s.matches)
  const overrides = useStore(groupScoreStore, s => s.overrides)

  useEffect(() => {
    bracketStore.getState().applyOfficialLocks()
  }, [])

  const [tz, setTz] = useState<string>(() => {
    try { return localStorage.getItem(TZ_STORAGE_KEY) || LOCAL_TZ } catch { return LOCAL_TZ }
  })
  const [teamSearch, setTeamSearch] = useState('')

  function handleTzChange(value: string) {
    setTz(value)
    try { localStorage.setItem(TZ_STORAGE_KEY, value) } catch {}
  }

  const filteredSchedule = useMemo(() => {
    const q = teamSearch.trim().toLowerCase()
    if (!q) return SCHEDULE
    return SCHEDULE.filter(match => {
      const home = resolveScheduleTeam(match.homeTeam, groups, matches, overrides, match.matchNumber)
      const away = resolveScheduleTeam(match.awayTeam, groups, matches, overrides, match.matchNumber)
      return home.name.toLowerCase().includes(q) || away.name.toLowerCase().includes(q)
    })
  }, [teamSearch, groups, matches, overrides])

  const grouped = useMemo(
    () => groupByDate(filteredSchedule, tz),
    [filteredSchedule, tz],
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
        <span className="text-xl font-bold tracking-tight">WC 2026 Schedule</span>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            value={teamSearch}
            onChange={e => setTeamSearch(e.target.value)}
            placeholder="Search team…"
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white placeholder-gray-500 outline-none w-36"
          />
          <TzPicker value={tz} onChange={handleTzChange} />
          <SyncResultsButton />
          <a href="/predictor" className="text-sm px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 whitespace-nowrap">← Predictor</a>
        </div>
      </header>

      <p className="max-w-4xl mx-auto px-4 pt-4 text-xs text-gray-500 leading-relaxed">
        <span className="text-gray-400">Score key:</span>{' '}
        <span className="font-mono text-gray-400">2–2</span> after 90 min ·{' '}
        <span className="font-mono text-gray-400">[3]–[2]</span> after 120 min (extra time) ·{' '}
        <span className="font-mono text-gray-400">(4)–(2)</span> penalty shootout tie-breaker
      </p>

      <main className="max-w-4xl mx-auto px-4 py-4">
        {grouped.map(({ label, sortKey, items }) => (
          <section key={sortKey} className="mb-8">
            <h2 className="text-base font-semibold text-gray-300 mb-3 border-b border-gray-800 pb-1">{label}</h2>
            <div className="space-y-2">
              {items.map(match => {
                const home = resolveScheduleTeam(match.homeTeam, groups, matches, overrides, match.matchNumber)
                const away = resolveScheduleTeam(match.awayTeam, groups, matches, overrides, match.matchNumber)
                return (
                  <ScheduleMatchRow
                    key={match.matchNumber}
                    match={match}
                    home={home}
                    away={away}
                    tz={tz}
                  />
                )
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}

export const Route = createFileRoute('/schedule')({
  component: SchedulePage,
})
