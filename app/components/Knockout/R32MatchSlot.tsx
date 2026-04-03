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
  const rowState = isWinner ? 'row-winner' : dimmed ? 'row-loser' : 'row-idle'
  return (
    <div
      onClick={canClick ? onClick : undefined}
      className={`match-row ${rowState} ${canClick ? 'row-clickable' : 'row-inert'}`}
    >
      {team ? (
        <>
          <span className={`fi fi-${team.flagCode} match-flag`} />
          <span className={`match-name ${isWinner ? 'name-win' : dimmed ? 'name-lose' : ''}`}>{team.name}</span>
          <button
            className="match-clear"
            onClick={e => { e.stopPropagation(); onClear?.() }}
            title="Remove"
          >×</button>
        </>
      ) : (
        <span className="match-seed">{label}</span>
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
    <div className={`match-card flex flex-col ${hasWinner ? 'winner-set' : ''}`}>
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
      <div className="match-divider" />
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
