import { getTeamById } from '../../data/teams'
import { LockIcon } from '../LockIcon'
import { TeamFlag } from '../TeamFlag'

interface Props {
  teamId: string | null
  label: string
  scoreLabel?: string
  isWinner: boolean
  dimmed: boolean
  canClick: boolean
  showLock?: boolean
  pickDisabled?: boolean
  onClick: () => void
  onClear?: () => void
}

export function KnockoutTeamRow({
  teamId,
  label,
  scoreLabel,
  isWinner,
  dimmed,
  canClick,
  showLock,
  pickDisabled,
  onClick,
  onClear,
}: Props) {
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
          <TeamFlag code={team.flagCode} className="match-flag" />
          <span className={`match-name ${isWinner ? 'name-win' : dimmed ? 'name-lose' : ''}`}>{team.name}</span>
          {scoreLabel ? <span className="match-score">{scoreLabel}</span> : null}
          {showLock
            ? <span className="match-lock"><LockIcon /></span>
            : onClear
              ? <button className="match-clear" onClick={e => { e.stopPropagation(); onClear() }} title="Remove">×</button>
              : null}
        </>
      ) : (
        <span className="match-seed">{label}</span>
      )}
    </div>
  )
}
