import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { getMatchLoser } from '../../lib/bracket'
import { CONFIRMED_MATCHES } from '../../data/confirmed'
import { getTeamById } from '../../data/teams'
import { LockIcon } from '../LockIcon'
import type { MatchId } from '../../data/teams'

interface Props {
  onWinnerPick: (matchId: MatchId, teamId: string) => void
}

function SlotRow({
  teamId,
  isWinner,
  dimmed,
  canClick,
  showLock,
  pickDisabled,
  onClick,
}: {
  teamId: string | null
  isWinner: boolean
  dimmed: boolean
  canClick: boolean
  showLock?: boolean
  pickDisabled?: boolean
  onClick: () => void
}) {
  const team = teamId ? getTeamById(teamId) : null
  const rowState = isWinner ? 'row-winner' : dimmed ? 'row-loser' : 'row-idle'
  const clickable = canClick && !pickDisabled

  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`match-row ${rowState} ${clickable ? 'row-clickable' : 'row-inert'}`}
    >
      {team ? (
        <>
          <span className={`fi fi-${team.flagCode} match-flag`} />
          <span className={`match-name ${isWinner ? 'name-win' : dimmed ? 'name-lose' : ''}`}>
            {team.name}
          </span>
          {showLock ? (
            <span className="match-lock"><LockIcon /></span>
          ) : null}
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

  const winnerLocked = CONFIRMED_MATCHES.third_place !== undefined
  const storedWinner = matches.third_place?.winner ?? null
  const officialWinner = winnerLocked ? CONFIRMED_MATCHES.third_place : null
  const winner =
    officialWinner ??
    (storedWinner && (storedWinner === homeId || storedWinner === awayId)
      ? storedWinner
      : null)
  const hasWinner = winner !== null
  const bothKnown = homeId !== null && awayId !== null

  return (
    <div className={`match-card flex flex-col ${hasWinner ? 'winner-set' : ''}`}>
      <SlotRow
        teamId={homeId}
        isWinner={hasWinner && winner === homeId}
        dimmed={hasWinner && winner !== homeId}
        canClick={!!homeId && bothKnown}
        showLock={winnerLocked}
        pickDisabled={winnerLocked}
        onClick={() => homeId && onWinnerPick('third_place', homeId)}
      />

      <div className="match-divider" />

      <SlotRow
        teamId={awayId}
        isWinner={hasWinner && winner === awayId}
        dimmed={hasWinner && winner !== awayId}
        canClick={!!awayId && bothKnown}
        showLock={winnerLocked}
        pickDisabled={winnerLocked}
        onClick={() => awayId && onWinnerPick('third_place', awayId)}
      />
    </div>
  )
}
