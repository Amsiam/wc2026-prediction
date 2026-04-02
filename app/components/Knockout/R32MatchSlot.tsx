import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { getTeamById, R32_FIXTURES, getGroup } from '../../data/teams'
import type { MatchId, SeedSource, GroupKey } from '../../data/teams'
import type { GroupPick } from '../../store/types'

interface Props {
  matchId: MatchId
  onSlotClick: (matchId: MatchId, side: 'home' | 'away') => void
  onWinnerPick: (matchId: MatchId, teamId: string) => void
}

function resolveTeamId(seed: SeedSource, groups: Record<GroupKey, GroupPick>, matchId: MatchId): string | null {
  if (seed.source === 'winner') return groups[seed.group!].first
  if (seed.source === 'runner') return groups[seed.group!].second
  if (seed.source === 'third') {
    for (const g of seed.groups ?? []) {
      const gp = groups[g as GroupKey]
      if (gp.third && gp.thirdSlot === matchId) return gp.third
    }
  }
  return null
}

function seedLabel(seed: SeedSource): string {
  if (seed.source === 'winner') return `1st Group ${seed.group}`
  if (seed.source === 'runner') return `2nd Group ${seed.group}`
  return `3rd (${seed.groups!.join('/')})`
}

function TeamRow({ teamId, label, isWinner, dimmed, canClick, onClick, onClear }: {
  teamId: string | null
  label: string
  isWinner: boolean
  dimmed: boolean
  canClick: boolean
  onClick: () => void
  onClear?: () => void
}) {
  const team = teamId ? getTeamById(teamId) : null
  return (
    <div
      onClick={canClick ? onClick : undefined}
      className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
        isWinner
          ? 'bg-green-800 text-white hover:bg-green-700 cursor-pointer'
          : dimmed
          ? 'text-gray-400 hover:bg-gray-700 cursor-pointer'
          : canClick
          ? 'text-gray-300 hover:bg-gray-700 cursor-pointer'
          : 'text-gray-500 cursor-default'
      }`}
    >
      {team ? (
        <>
          <span className={`fi fi-${team.flagCode} shrink-0`} />
          <span className="truncate">{team.name}</span>
          {isWinner && <span className="text-xs text-green-400">✓</span>}
          <button
            className="ml-auto text-gray-600 hover:text-red-400 text-base leading-none px-0.5"
            onClick={e => { e.stopPropagation(); onClear?.() }}
            title="Remove"
          >×</button>
        </>
      ) : (
        <span className="italic text-gray-500 text-xs">{label}</span>
      )}
    </div>
  )
}

export function R32MatchSlot({ matchId, onSlotClick, onWinnerPick }: Props) {
  const match = useStore(bracketStore, s => s.matches[matchId])
  const groups = useStore(bracketStore, s => s.groups)

  const fixture = R32_FIXTURES.find(f => f.id === matchId)
  if (!fixture) return null

  const homeId = resolveTeamId(fixture.home, groups, matchId)
  const awayId = resolveTeamId(fixture.away, groups, matchId)
  const winner = match?.winner ?? null
  const hasWinner = winner !== null
  const bothKnown = homeId !== null && awayId !== null

  return (
    <div className={`flex flex-col w-44 rounded border ${hasWinner ? 'border-green-700' : 'border-gray-700'} bg-gray-900`}>
      <TeamRow
        teamId={homeId}
        label={seedLabel(fixture.home)}
        isWinner={hasWinner && winner === homeId}
        dimmed={hasWinner && winner !== homeId}
        canClick={homeId !== null ? bothKnown : true}
        onClick={homeId !== null && bothKnown
          ? () => onWinnerPick(matchId, homeId)
          : () => onSlotClick(matchId, 'home')}
        onClear={homeId !== null ? () => bracketStore.getState().clearTeam(homeId) : undefined}
      />
      <div className="border-t border-gray-800 mx-2" />
      <TeamRow
        teamId={awayId}
        label={seedLabel(fixture.away)}
        isWinner={hasWinner && winner === awayId}
        dimmed={hasWinner && winner !== awayId}
        canClick={awayId !== null ? bothKnown : true}
        onClick={awayId !== null && bothKnown
          ? () => onWinnerPick(matchId, awayId)
          : () => onSlotClick(matchId, 'away')}
        onClear={awayId !== null ? () => bracketStore.getState().clearTeam(awayId) : undefined}
      />
    </div>
  )
}
