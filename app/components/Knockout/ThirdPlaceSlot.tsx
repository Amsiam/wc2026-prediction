import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { getMatchLoser } from '../../lib/bracket'
import { getTeamById } from '../../data/teams'
import type { MatchId } from '../../data/teams'

interface Props {
  onWinnerPick: (matchId: MatchId, teamId: string) => void
}

function SlotRow({
  teamId,
  isWinner,
  dimmed,
  canClick,
  onClick,
}: {
  teamId: string | null
  isWinner: boolean
  dimmed: boolean
  canClick: boolean
  onClick: () => void
}) {
  const team = teamId ? getTeamById(teamId) : null
  const rowState = isWinner ? 'row-winner' : dimmed ? 'row-loser' : 'row-idle'

  return (
    <div
      onClick={canClick ? onClick : undefined}
      className={`match-row ${rowState} ${canClick ? 'row-clickable' : 'row-inert'}`}
    >
      {team ? (
        <>
          <span className={`fi fi-${team.flagCode} match-flag`} />
          <span className={`match-name ${isWinner ? 'name-win' : dimmed ? 'name-lose' : ''}`}>
            {team.name}
          </span>
        </>
      ) : (
        <span className="match-seed">TBD</span>
      )}
    </div>
  )
}

export function ThirdPlaceSlot({ onWinnerPick }: Props) {
  const matches = useStore(bracketStore, s => s.matches)

  const homeId = getMatchLoser('sf_m1', matches)
  const awayId = getMatchLoser('sf_m2', matches)

  const storedWinner = matches.third_place?.winner ?? null
  const winner =
    storedWinner && (storedWinner === homeId || storedWinner === awayId)
      ? storedWinner
      : null
  const hasWinner = winner !== null
  const bothKnown = homeId !== null && awayId !== null

  return (
    <div className={`match-card flex flex-col ${hasWinner ? 'winner-set' : ''}`}>
      <SlotRow
        teamId={homeId}
        isWinner={hasWinner && winner === homeId}
        dimmed={hasWinner && winner !== homeId}
        canClick={!!homeId && bothKnown}
        onClick={() => homeId && onWinnerPick('third_place', homeId)}
      />

      <div className="match-divider" />

      <SlotRow
        teamId={awayId}
        isWinner={hasWinner && winner === awayId}
        dimmed={hasWinner && winner !== awayId}
        canClick={!!awayId && bothKnown}
        onClick={() => awayId && onWinnerPick('third_place', awayId)}
      />
    </div>
  )
}
