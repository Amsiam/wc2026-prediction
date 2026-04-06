import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { getTeamById, BRACKET_TREE, R32_FIXTURES } from '../../data/teams'
import { CONFIRMED_MATCHES } from '../../data/confirmed'
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

function SlotRow({ teamId, label, isWinner, dimmed, canClick, locked, onClick, onClear }: {
  teamId: string | null
  label: string
  isWinner: boolean
  dimmed: boolean
  canClick: boolean
  locked?: boolean
  onClick: () => void
  onClear?: () => void
}) {
  const team = teamId ? getTeamById(teamId) : null
  const rowState = isWinner ? 'row-winner' : dimmed ? 'row-loser' : 'row-idle'
  const clickable = canClick && !locked
  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`match-row ${rowState} ${clickable ? 'row-clickable' : 'row-inert'}`}
    >
      {team ? (
        <>
          <span className={`fi fi-${team.flagCode} match-flag`} />
          <span className={`match-name ${isWinner ? 'name-win' : dimmed ? 'name-lose' : ''}`}>{team.name}</span>
          {locked
            ? <span className="match-clear" style={{ opacity: 1, color: '#4a7a9b', cursor: 'default' }}>🔒</span>
            : <button className="match-clear" onClick={e => { e.stopPropagation(); onClear?.() }} title="Remove">×</button>
          }
        </>
      ) : (
        <span className="match-seed">{label}</span>
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
  const winnerLocked = CONFIRMED_MATCHES[matchId] !== undefined
  const homeSrcLocked = children ? CONFIRMED_MATCHES[children[0] as MatchId] !== undefined : false
  const awaySrcLocked = children ? CONFIRMED_MATCHES[children[1] as MatchId] !== undefined : false

  return (
    <div className={`match-card flex flex-col ${hasWinner ? 'winner-set' : ''}`}>
      <SlotRow
        teamId={homeId}
        label={homeLabel}
        isWinner={hasWinner && winner === homeId}
        dimmed={hasWinner && winner !== homeId}
        canClick={homeId !== null ? bothKnown : true}
        locked={homeId !== null ? (homeSrcLocked || winnerLocked) : homeSrcLocked}
        onClick={homeId !== null && bothKnown
          ? () => onWinnerPick(matchId, homeId)
          : () => onSlotClick(matchId, 'home')}
        onClear={homeId !== null ? () => bracketStore.getState().clearTeam(homeId) : undefined}
      />
      <div className="match-divider" />
      <SlotRow
        teamId={awayId}
        label={awayLabel}
        isWinner={hasWinner && winner === awayId}
        dimmed={hasWinner && winner !== awayId}
        canClick={awayId !== null ? bothKnown : true}
        locked={awayId !== null ? (awaySrcLocked || winnerLocked) : awaySrcLocked}
        onClick={awayId !== null && bothKnown
          ? () => onWinnerPick(matchId, awayId)
          : () => onSlotClick(matchId, 'away')}
        onClear={awayId !== null ? () => bracketStore.getState().clearTeam(awayId) : undefined}
      />
    </div>
  )
}
