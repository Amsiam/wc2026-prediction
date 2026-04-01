import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { getTeamById } from '../../data/teams'
import type { MatchId } from '../../data/teams'

interface Props {
  matchId: MatchId
  onSlotClick: (matchId: MatchId) => void
}

export function MatchSlot({ matchId, onSlotClick }: Props) {
  const match = useStore(bracketStore, s => s.matches[matchId])
  const winner = match.winner ? getTeamById(match.winner) : null

  return (
    <button
      onClick={() => onSlotClick(matchId)}
      className={`
        flex items-center gap-2 px-3 py-2 rounded border text-sm w-44 transition-all
        ${winner
          ? 'border-green-600 bg-gray-800 text-white hover:border-green-400'
          : 'border-gray-700 bg-gray-900 text-gray-500 hover:border-gray-500 hover:text-gray-300'}
      `}
    >
      {winner ? (
        <>
          <span className={`fi fi-${winner.flagCode} flex-shrink-0`} />
          <span className="truncate">{winner.name}</span>
        </>
      ) : (
        <span className="italic">TBD</span>
      )}
    </button>
  )
}
