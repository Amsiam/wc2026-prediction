import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { getTeamById, R32_FIXTURES, getGroup } from '../../data/teams'
import type { MatchId, SeedSource, GroupKey } from '../../data/teams'
import type { GroupPick } from '../../store/types'

interface Props {
  matchId: MatchId
  onSlotClick: (matchId: MatchId) => void
}

function resolveTeamId(seed: SeedSource, groups: Record<GroupKey, GroupPick>): string | null {
  if (seed.source === 'winner') return groups[seed.group!].first
  if (seed.source === 'runner') return groups[seed.group!].second
  if (seed.source === 'third') {
    for (const g of seed.groups ?? []) {
      const t = groups[g as GroupKey].third
      if (t) {
        // verify this team is actually from this group
        const inGroup = getGroup(g as GroupKey).some(tm => tm.id === t)
        if (inGroup) return t
      }
    }
  }
  return null
}

function seedLabel(seed: SeedSource): string {
  if (seed.source === 'winner') return `1st Group ${seed.group}`
  if (seed.source === 'runner') return `2nd Group ${seed.group}`
  return `3rd (${seed.groups!.join('/')})`
}

function TeamRow({ teamId, label, isWinner, dimmed }: {
  teamId: string | null
  label: string
  isWinner: boolean
  dimmed: boolean
}) {
  const team = teamId ? getTeamById(teamId) : null
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
      isWinner
        ? 'bg-green-800 text-white'
        : dimmed
        ? 'text-gray-600'
        : 'text-gray-300'
    }`}>
      {team ? (
        <>
          <span className={`fi fi-${team.flagCode} flex-shrink-0`} />
          <span className="truncate">{team.name}</span>
        </>
      ) : (
        <span className="italic text-gray-500 text-xs">{label}</span>
      )}
      {isWinner && <span className="ml-auto text-xs text-green-400">✓</span>}
    </div>
  )
}

export function R32MatchSlot({ matchId, onSlotClick }: Props) {
  const match = useStore(bracketStore, s => s.matches[matchId])
  const groups = useStore(bracketStore, s => s.groups)

  const fixture = R32_FIXTURES.find(f => f.id === matchId)
  if (!fixture) return null

  const homeId = resolveTeamId(fixture.home, groups)
  const awayId = resolveTeamId(fixture.away, groups)
  const winner = match.winner ?? null
  const hasWinner = winner !== null

  return (
    <button
      onClick={() => onSlotClick(matchId)}
      className={`flex flex-col w-44 rounded border transition-all hover:border-gray-500 ${
        hasWinner ? 'border-green-700 bg-gray-850' : 'border-gray-700 bg-gray-900'
      }`}
    >
      <TeamRow
        teamId={homeId}
        label={seedLabel(fixture.home)}
        isWinner={hasWinner && winner === homeId}
        dimmed={hasWinner && winner !== homeId}
      />
      <div className="border-t border-gray-800 mx-2" />
      <TeamRow
        teamId={awayId}
        label={seedLabel(fixture.away)}
        isWinner={hasWinner && winner === awayId}
        dimmed={hasWinner && winner !== awayId}
      />
    </button>
  )
}
