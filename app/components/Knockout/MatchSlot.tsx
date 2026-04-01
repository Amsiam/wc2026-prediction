import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { getTeamById, BRACKET_TREE } from '../../data/teams'
import type { MatchId } from '../../data/teams'

interface Props {
  matchId: MatchId
  onSlotClick: (matchId: MatchId) => void
  onTeamSelect?: (matchId: MatchId, teamId: string) => void
}

function TeamRow({ teamId, isWinner, dimmed, onClick }: {
  teamId: string | null
  isWinner: boolean
  dimmed: boolean
  onClick?: () => void
}) {
  const team = teamId ? getTeamById(teamId) : null
  return (
    <div
      onClick={teamId && onClick ? (e) => { e.stopPropagation(); onClick() } : undefined}
      className={`flex items-center gap-2 px-2 py-1.5 text-sm transition-colors rounded ${
        isWinner
          ? 'bg-green-800 text-white'
          : dimmed
          ? 'text-gray-600'
          : teamId
          ? 'text-gray-300 hover:bg-gray-700 cursor-pointer'
          : 'text-gray-600'
      }`}
    >
      {team ? (
        <>
          <span className={`fi fi-${team.flagCode} flex-shrink-0`} />
          <span className="truncate">{team.name}</span>
        </>
      ) : (
        <span className="italic text-gray-500 text-xs">TBD</span>
      )}
      {isWinner && <span className="ml-auto text-xs text-green-400">✓</span>}
    </div>
  )
}

export function MatchSlot({ matchId, onSlotClick, onTeamSelect }: Props) {
  const match = useStore(bracketStore, s => s.matches[matchId])
  const matches = useStore(bracketStore, s => s.matches)

  const children = (BRACKET_TREE as Record<string, readonly string[]>)[matchId] as readonly MatchId[] | undefined
  const homeId = children ? (matches[children[0]]?.winner ?? null) : null
  const awayId = children ? (matches[children[1]]?.winner ?? null) : null

  const winner = match.winner ?? null
  const hasWinner = winner !== null

  // If both participants known, allow direct row click; otherwise open picker
  const canDirectPick = homeId !== null && awayId !== null

  return (
    <button
      onClick={() => { if (!canDirectPick) onSlotClick(matchId) }}
      className={`flex flex-col w-44 rounded border transition-all ${
        hasWinner ? 'border-green-700' : 'border-gray-700'
      } ${!canDirectPick ? 'hover:border-gray-500 cursor-pointer bg-gray-900' : 'bg-gray-900 cursor-default'}`}
    >
      <TeamRow
        teamId={homeId}
        isWinner={hasWinner && winner === homeId}
        dimmed={hasWinner && winner !== homeId}
        onClick={canDirectPick && onTeamSelect ? () => onTeamSelect(matchId, homeId!) : undefined}
      />
      <div className="border-t border-gray-800 mx-2" />
      <TeamRow
        teamId={awayId}
        isWinner={hasWinner && winner === awayId}
        dimmed={hasWinner && winner !== awayId}
        onClick={canDirectPick && onTeamSelect ? () => onTeamSelect(matchId, awayId!) : undefined}
      />
    </button>
  )
}
