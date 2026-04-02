import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { getTeamById, BRACKET_TREE, R32_FIXTURES } from '../../data/teams'
import type { MatchId, SeedSource } from '../../data/teams'

function shortSeed(s: SeedSource): string {
  if (s.source === 'winner') return `1${s.group}`
  if (s.source === 'runner') return `2${s.group}`
  return `3rd`
}

function childLabel(childId: MatchId): string {
  if (childId.startsWith('r32')) {
    const f = R32_FIXTURES.find(x => x.id === childId)
    if (f) return `${shortSeed(f.home)} vs ${shortSeed(f.away)}`
  }
  // r16/qf/sf — just show a short form
  return childId.replace('r16_m', 'R16-').replace('qf_m', 'QF-').replace('sf_m', 'SF-')
}

interface Props {
  matchId: MatchId
  onSlotClick: (matchId: MatchId, side: 'home' | 'away') => void
  onWinnerPick: (matchId: MatchId, teamId: string) => void
}

function SlotRow({ teamId, label, isWinner, dimmed, canClick, onClick, onClear }: {
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
        isWinner ? 'bg-green-800 text-white hover:bg-green-700 cursor-pointer'
        : dimmed ? 'text-gray-400 hover:bg-gray-700 cursor-pointer'
        : canClick ? 'text-gray-300 hover:bg-gray-700 cursor-pointer'
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
        <span className="italic text-gray-500 text-xs truncate">{label}</span>
      )}
    </div>
  )
}

export function MatchSlot({ matchId, onSlotClick, onWinnerPick }: Props) {
  const match = useStore(bracketStore, s => s.matches[matchId])
  const matches = useStore(bracketStore, s => s.matches)
  const children = (BRACKET_TREE as Record<string, readonly string[]>)[matchId] as readonly MatchId[] | undefined
  const homeId = children ? (matches[children[0]]?.winner ?? null) : null
  const awayId = children ? (matches[children[1]]?.winner ?? null) : null
  const homeLabel = children ? childLabel(children[0] as MatchId) : 'TBD'
  const awayLabel = children ? childLabel(children[1] as MatchId) : 'TBD'
  const bothKnown = homeId !== null && awayId !== null
  const winner = match?.winner ?? null
  const hasWinner = winner !== null

  return (
    <div className={`flex flex-col w-44 rounded border ${hasWinner ? 'border-green-700' : 'border-gray-700'} bg-gray-900`}>
      <SlotRow
        teamId={homeId}
        label={homeLabel}
        isWinner={hasWinner && winner === homeId}
        dimmed={hasWinner && winner !== homeId}
        canClick={homeId !== null ? bothKnown : true}
        onClick={homeId !== null && bothKnown
          ? () => onWinnerPick(matchId, homeId)
          : () => onSlotClick(matchId, 'home')}
        onClear={homeId !== null ? () => bracketStore.getState().clearTeam(homeId) : undefined}
      />
      <div className="border-t border-gray-800 mx-2" />
      <SlotRow
        teamId={awayId}
        label={awayLabel}
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
