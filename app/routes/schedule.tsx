import { createFileRoute } from '@tanstack/react-router'
import { SCHEDULE, type ScheduleMatch } from '../data/schedule'

function formatLocalTime(utcDate: string): string {
  const date = new Date(utcDate)
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
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
  'Group Stage':   'text-blue-400',
  'Round of 32':  'text-purple-400',
  'Round of 16':  'text-orange-400',
  'Quarterfinal': 'text-yellow-400',
  'Semifinal':    'text-red-400',
  '3rd Place':    'text-green-400',
  'Final':        'text-yellow-300',
}

function SchedulePage() {
  const grouped = groupByDate(SCHEDULE)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight">WC 2026 Schedule</span>
        <a href="/predictor" className="text-sm px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600">← Predictor</a>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-sm text-gray-400 mb-6">All times shown in your local timezone.</p>

        {[...grouped.entries()].map(([date, matches]) => (
          <section key={date} className="mb-8">
            <h2 className="text-base font-semibold text-gray-300 mb-3 border-b border-gray-800 pb-1">{date}</h2>
            <div className="space-y-2">
              {matches.map(match => (
                <div key={match.matchNumber} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
                  <span className="text-xs text-gray-500 w-8 flex-shrink-0">M{match.matchNumber}</span>
                  <span className={`text-xs font-medium w-28 flex-shrink-0 ${ROUND_COLORS[match.round] ?? 'text-gray-400'}`}>
                    {match.round}{match.group ? ` ${match.group}` : ''}
                  </span>
                  <span className="flex-1 text-sm">
                    <span className="font-medium">{match.homeTeam}</span>
                    <span className="text-gray-500 mx-2">vs</span>
                    <span className="font-medium">{match.awayTeam}</span>
                  </span>
                  <div className="text-right">
                    <div className="text-sm text-gray-200">{formatLocalTime(match.utcDate)}</div>
                    <div className="text-xs text-gray-500">{match.city}</div>
                  </div>
                </div>
              ))}
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
