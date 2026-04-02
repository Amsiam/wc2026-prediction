import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { getTeamById, BRACKET_TREE } from '../../data/teams'
import type { MatchId } from '../../data/teams'

interface Props {
  onWinnerPick: (matchId: MatchId, teamId: string) => void
}

function getSFLoser(
  sfId: MatchId,
  matches: Record<string, { winner: string | null }>
): string | null {
  const sfWinner = matches[sfId]?.winner
  if (!sfWinner) return null
  const children = (BRACKET_TREE as Record<string, readonly string[]>)[sfId]
  if (!children) return null
  const a = matches[children[0]]?.winner
  const b = matches[children[1]]?.winner
  if (a && a !== sfWinner) return a
  if (b && b !== sfWinner) return b
  return null
}

export function ThirdPlaceSlot({ onWinnerPick }: Props) {
  const matches = useStore(bracketStore, s => s.matches)
  const homeId = getSFLoser('sf_m1', matches as Record<string, { winner: string | null }>)
  const awayId = getSFLoser('sf_m2', matches as Record<string, { winner: string | null }>)
  const winner = matches.third_place?.winner ?? null
  const hasWinner = winner !== null
  const bothKnown = homeId !== null && awayId !== null

  function SlotRow({ teamId, isWinner, dimmed }: { teamId: string | null; isWinner: boolean; dimmed: boolean }) {
    const team = teamId ? getTeamById(teamId) : null
    return (
      <div
        onClick={teamId && bothKnown ? () => onWinnerPick('third_place', teamId) : undefined}
        className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
          isWinner ? 'bg-green-800 text-white hover:bg-green-700 cursor-pointer'
          : dimmed ? 'text-gray-400 hover:bg-gray-700 cursor-pointer'
          : teamId && bothKnown ? 'text-gray-300 hover:bg-gray-700 cursor-pointer'
          : 'text-gray-500'
        }`}
      >
        {team
          ? <><span className={`fi fi-${team.flagCode} flex-shrink-0`} /><span className="truncate">{team.name}</span></>
          : <span className="italic text-xs text-gray-500">TBD</span>}
        {isWinner && <span className="ml-auto text-xs text-green-400">✓</span>}
      </div>
    )
  }

  return (
    <div className={`flex flex-col w-44 rounded border ${hasWinner ? 'border-green-700' : 'border-gray-700'} bg-gray-900`}>
      <SlotRow teamId={homeId} isWinner={hasWinner && winner === homeId} dimmed={hasWinner && winner !== homeId} />
      <div className="border-t border-gray-800 mx-2" />
      <SlotRow teamId={awayId} isWinner={hasWinner && winner === awayId} dimmed={hasWinner && winner !== awayId} />
    </div>
  )
}
