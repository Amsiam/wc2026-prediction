import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useStore } from 'zustand'
import { bracketStore } from '../store/bracketStore'
import { groupScoreStore } from '../store/groupScoreStore'
import { SCHEDULE, type ScheduleMatch } from '../data/schedule'
import { BRACKET_TREE, getTeamById, TEAMS } from '../data/teams'
import type { GroupKey, MatchId } from '../data/teams'
import type { GroupPick } from '../store/types'

// Schedule match number → bracket match ID
const SCHEDULE_TO_BRACKET: Record<number, MatchId> = {
  73: 'r32_m1',  74: 'r32_m2',  75: 'r32_m3',  76: 'r32_m4',
  77: 'r32_m5',  78: 'r32_m6',  79: 'r32_m7',  80: 'r32_m8',
  81: 'r32_m9',  82: 'r32_m10', 83: 'r32_m11', 84: 'r32_m12',
  85: 'r32_m13', 86: 'r32_m14', 87: 'r32_m15', 88: 'r32_m16',
  89: 'r16_m1',  90: 'r16_m2',  91: 'r16_m3',  92: 'r16_m4',
  93: 'r16_m5',  94: 'r16_m6',  95: 'r16_m7',  96: 'r16_m8',
  97: 'qf_m1',   98: 'qf_m2',   99: 'qf_m3',   100: 'qf_m4',
  101: 'sf_m1',  102: 'sf_m2',
}

interface ResolvedTeam {
  name: string
  flagCode?: string
  known: boolean
}

function resolveTeam(
  str: string,
  groups: Record<GroupKey, GroupPick>,
  matches: Record<MatchId, { winner: string | null }>,
  overrides: Record<string, { name: string; flagCode: string }>
): ResolvedTeam {
  // "1st X"
  const first = str.match(/^1st ([A-L])$/)
  if (first) {
    const teamId = groups[first[1] as GroupKey]?.first
    if (teamId) {
      const ov = overrides[teamId]
      const team = getTeamById(teamId)
      return { name: ov?.name ?? team?.name ?? str, flagCode: ov?.flagCode ?? team?.flagCode, known: true }
    }
    return { name: str, known: false }
  }

  // "2nd X"
  const second = str.match(/^2nd ([A-L])$/)
  if (second) {
    const teamId = groups[second[1] as GroupKey]?.second
    if (teamId) {
      const ov = overrides[teamId]
      const team = getTeamById(teamId)
      return { name: ov?.name ?? team?.name ?? str, flagCode: ov?.flagCode ?? team?.flagCode, known: true }
    }
    return { name: str, known: false }
  }

  // "3rd ABCDE..." — just show placeholder
  if (str.startsWith('3rd')) return { name: str, known: false }

  // "W{n}" — winner of bracket match
  const winner = str.match(/^W(\d+)$/)
  if (winner) {
    const bracketId = SCHEDULE_TO_BRACKET[parseInt(winner[1])]
    if (bracketId) {
      const teamId = matches[bracketId]?.winner
      if (teamId) {
        const ov = overrides[teamId]
        const team = getTeamById(teamId)
        return { name: ov?.name ?? team?.name ?? str, flagCode: ov?.flagCode ?? team?.flagCode, known: true }
      }
    }
    return { name: str, known: false }
  }

  // "L{n}" — loser of bracket match (3rd place)
  const loser = str.match(/^L(\d+)$/)
  if (loser) {
    const bracketId = SCHEDULE_TO_BRACKET[parseInt(loser[1])]
    if (bracketId) {
      const m = matches[bracketId]
      const children = (BRACKET_TREE as Record<string, [MatchId, MatchId]>)[bracketId]
      if (children && m?.winner) {
        const homeId = matches[children[0]]?.winner
        const awayId = matches[children[1]]?.winner
        const loserId = homeId === m.winner ? awayId : homeId
        if (loserId) {
          const ov = overrides[loserId]
          const team = getTeamById(loserId)
          return { name: ov?.name ?? team?.name ?? str, flagCode: ov?.flagCode ?? team?.flagCode, known: true }
        }
      }
    }
    return { name: str, known: false }
  }

  // Group stage: look up by name for overrides
  const teamByName = TEAMS.find(t => t.name === str)
  if (teamByName) {
    const ov = overrides[teamByName.id]
    return { name: ov?.name ?? str, flagCode: ov?.flagCode ?? teamByName.flagCode, known: true }
  }

  return { name: str, known: false }
}

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
    year: 'numeric', month: 'long', day: 'numeric', timeZone: tz,
  })
}

function groupByDate(matches: ScheduleMatch[], tz: string): Map<string, ScheduleMatch[]> {
  const map = new Map<string, ScheduleMatch[]>()
  for (const match of matches) {
    const date = getDateKey(match.utcDate, tz)
    const existing = map.get(date) ?? []
    existing.push(match)
    map.set(date, existing)
  }
  return map
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

function SchedulePage() {
  const groups    = useStore(bracketStore,    s => s.groups)
  const matches   = useStore(bracketStore,    s => s.matches)
  const overrides = useStore(groupScoreStore, s => s.overrides)

  const [tz, setTz] = useState<string>(() => {
    try { return localStorage.getItem(TZ_STORAGE_KEY) || LOCAL_TZ } catch { return LOCAL_TZ }
  })

  function handleTzChange(value: string) {
    setTz(value)
    try { localStorage.setItem(TZ_STORAGE_KEY, value) } catch {}
  }

  const grouped = groupByDate(SCHEDULE, tz)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
        <span className="text-xl font-bold tracking-tight">WC 2026 Schedule</span>
        <div className="flex items-center gap-3">
          <TzPicker value={tz} onChange={handleTzChange} />
          <a href="/predictor" className="text-sm px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 whitespace-nowrap">← Predictor</a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {[...grouped.entries()].map(([date, dayMatches]) => (
          <section key={date} className="mb-8">
            <h2 className="text-base font-semibold text-gray-300 mb-3 border-b border-gray-800 pb-1">{date}</h2>
            <div className="space-y-2">
              {dayMatches.map(match => {
                const home = resolveTeam(match.homeTeam, groups, matches, overrides)
                const away = resolveTeam(match.awayTeam, groups, matches, overrides)
                return (
                  <div key={match.matchNumber} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:py-3">
                    {/* Top row: match# + round + teams */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-gray-500 shrink-0">M{match.matchNumber}</span>
                      <span className={`text-xs font-medium shrink-0 ${ROUND_COLORS[match.round] ?? 'text-gray-400'}`}>
                        {match.group ? `Grp ${match.group}` : match.round.replace('Round of ', 'R')}
                      </span>
                      <span className="text-sm flex items-center gap-1 min-w-0 flex-1">
                        <TeamLabel team={home} />
                        <span className="text-gray-500 mx-0.5 shrink-0">vs</span>
                        <TeamLabel team={away} />
                      </span>
                    </div>
                    {/* Bottom row on mobile / right side on desktop */}
                    <div className="flex items-center gap-2 sm:ml-auto sm:text-right sm:flex-col sm:items-end sm:gap-0">
                      <span className="text-xs text-gray-200">{formatTime(match.utcDate, tz)}</span>
                      <span className="text-xs text-gray-500">{match.city}</span>
                    </div>
                  </div>
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
