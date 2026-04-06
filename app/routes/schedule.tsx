import { createFileRoute } from '@tanstack/react-router'
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

function formatLocalTime(utcDate: string): string {
  const date = new Date(utcDate)
  return date.toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })
}

function groupByDate(matches: ScheduleMatch[]): Map<string, ScheduleMatch[]> {
  const map = new Map<string, ScheduleMatch[]>()
  for (const match of matches) {
    const date = new Date(match.utcDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
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

function SchedulePage() {
  const groups   = useStore(bracketStore,    s => s.groups)
  const matches  = useStore(bracketStore,    s => s.matches)
  const overrides = useStore(groupScoreStore, s => s.overrides)
  const grouped  = groupByDate(SCHEDULE)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight">WC 2026 Schedule</span>
        <a href="/predictor" className="text-sm px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600">← Predictor</a>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-sm text-gray-400 mb-6">All times shown in your local timezone. Teams resolve from your bracket predictions.</p>

        {[...grouped.entries()].map(([date, dayMatches]) => (
          <section key={date} className="mb-8">
            <h2 className="text-base font-semibold text-gray-300 mb-3 border-b border-gray-800 pb-1">{date}</h2>
            <div className="space-y-2">
              {dayMatches.map(match => {
                const home = resolveTeam(match.homeTeam, groups, matches, overrides)
                const away = resolveTeam(match.awayTeam, groups, matches, overrides)
                return (
                  <div key={match.matchNumber} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
                    <span className="text-xs text-gray-500 w-8 flex-shrink-0">M{match.matchNumber}</span>
                    <span className={`text-xs font-medium w-28 flex-shrink-0 ${ROUND_COLORS[match.round] ?? 'text-gray-400'}`}>
                      {match.round}{match.group ? ` ${match.group}` : ''}
                    </span>
                    <span className="flex-1 text-sm flex items-center gap-1 min-w-0">
                      <TeamLabel team={home} />
                      <span className="text-gray-500 mx-1 flex-shrink-0">vs</span>
                      <TeamLabel team={away} />
                    </span>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm text-gray-200">{formatLocalTime(match.utcDate)}</div>
                      <div className="text-xs text-gray-500">{match.city}</div>
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
