import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { getTeamById, BRACKET_TREE, R32_FIXTURES } from '../../data/teams'
import type { MatchId, SeedSource } from '../../data/teams'
import { CONFIRMED_MATCHES } from '../../data/confirmed'
import { LIVE_RESULTS } from '../../data/liveResults'
import { runtimeResultsStore } from '../../lib/runtimeResults'

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

function SlotRow({ teamId, label, isWinner, dimmed, canClick, showLock, pickDisabled, onClick, onClear }: {
  teamId: string | null
  label: string
  isWinner: boolean
  dimmed: boolean
  canClick: boolean
  showLock?: boolean
  pickDisabled?: boolean
  onClick: () => void
  onClear?: () => void
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
          <span className={`match-name ${isWinner ? 'name-win' : dimmed ? 'name-lose' : ''}`}>{team.name}</span>
          {showLock
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
  const runtimeKnockout = useStore(runtimeResultsStore, s => s.knockout)
  const children = (BRACKET_TREE as Record<string, readonly string[]>)[matchId] as readonly MatchId[] | undefined
  const homeChildId = children?.[0] as MatchId | undefined
  const awayChildId = children?.[1] as MatchId | undefined

  function feederWinner(childId: MatchId | undefined): string | null {
    if (!childId) return null
    return CONFIRMED_MATCHES[childId]
      ?? runtimeKnockout[childId]
      ?? LIVE_RESULTS.knockout[childId]
      ?? matches[childId]?.winner
      ?? null
  }

  function isOfficiallyDecided(childId: MatchId): boolean {
    return CONFIRMED_MATCHES[childId] !== undefined
      || runtimeKnockout[childId] !== undefined
      || LIVE_RESULTS.knockout[childId] !== undefined
  }

  const homeFeederLocked = homeChildId != null && isOfficiallyDecided(homeChildId)
  const awayFeederLocked = awayChildId != null && isOfficiallyDecided(awayChildId)
  const homeId = feederWinner(homeChildId)
  const awayId = feederWinner(awayChildId)
  const homeLabel = children ? childLabel(children[0] as MatchId) : 'TBD'
  const awayLabel = children ? childLabel(children[1] as MatchId) : 'TBD'
  const officialWinner = CONFIRMED_MATCHES[matchId]
    ?? runtimeKnockout[matchId]
    ?? LIVE_RESULTS.knockout[matchId]
  const winnerLocked = officialWinner !== undefined
  const winner = officialWinner ?? match?.winner ?? null
  const hasWinner = winner !== null
  const bothKnown = homeId !== null && awayId !== null

  return (
    <div className={`match-card flex flex-col ${hasWinner ? 'winner-set' : ''}`}>
      <SlotRow
        teamId={homeId}
        label={homeLabel}
        isWinner={hasWinner && winner === homeId}
        dimmed={hasWinner && winner !== homeId}
        canClick={homeId !== null ? bothKnown : true}
        showLock={homeId !== null && (homeFeederLocked || winnerLocked)}
        pickDisabled={winnerLocked}
        onClick={homeId !== null && bothKnown
          ? () => onWinnerPick(matchId, homeId)
          : () => onSlotClick(matchId, 'home')}
        onClear={homeId !== null && !homeFeederLocked && !winnerLocked
          ? () => bracketStore.getState().clearTeam(homeId)
          : undefined}
      />
      <div className="match-divider" />
      <SlotRow
        teamId={awayId}
        label={awayLabel}
        isWinner={hasWinner && winner === awayId}
        dimmed={hasWinner && winner !== awayId}
        canClick={awayId !== null ? bothKnown : true}
        showLock={awayId !== null && (awayFeederLocked || winnerLocked)}
        pickDisabled={winnerLocked}
        onClick={awayId !== null && bothKnown
          ? () => onWinnerPick(matchId, awayId)
          : () => onSlotClick(matchId, 'away')}
        onClear={awayId !== null && !awayFeederLocked && !winnerLocked
          ? () => bracketStore.getState().clearTeam(awayId)
          : undefined}
      />
    </div>
  )
}
