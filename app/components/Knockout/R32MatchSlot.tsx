import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { R32_FIXTURES } from '../../data/teams'
import { CONFIRMED_GROUPS } from '../../data/confirmed'
import type { MatchId, SeedSource, GroupKey } from '../../data/teams'
import type { GroupPick } from '../../store/types'
import { MATCH_NUMBER_BY_BRACKET } from '../../lib/knockoutParticipants'
import { formatTeamMatchScore } from '../../lib/matchScore'
import { useOfficialKnockoutWinner, useOfficialMatchResult } from '../../lib/runtimeResults'
import { KnockoutTeamRow } from './KnockoutTeamRow'

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

function isSeedLocked(seed: SeedSource, matchId: MatchId): boolean {
  if (seed.source === 'winner') {
    return CONFIRMED_GROUPS[seed.group!]?.first !== undefined
  }
  if (seed.source === 'runner') {
    return CONFIRMED_GROUPS[seed.group!]?.second !== undefined
  }
  if (seed.source === 'third') {
    for (const g of seed.groups ?? []) {
      const conf = CONFIRMED_GROUPS[g as GroupKey]
      if (conf?.third !== undefined && conf.thirdSlot === matchId) return true
    }
  }
  return false
}

export function R32MatchSlot({ matchId, onSlotClick, onWinnerPick }: Props) {
  const match = useStore(bracketStore, s => s.matches[matchId])
  const groups = useStore(bracketStore, s => s.groups)

  const fixture = R32_FIXTURES.find(f => f.id === matchId)
  if (!fixture) return null

  const homeId = resolveTeamId(fixture.home, groups, matchId)
  const awayId = resolveTeamId(fixture.away, groups, matchId)
  const officialWinner = useOfficialKnockoutWinner(matchId)
  const winnerLocked = officialWinner !== undefined
  const winner = officialWinner ?? match?.winner ?? null
  const hasWinner = winner !== null
  const bothKnown = homeId !== null && awayId !== null
  const homeLocked = isSeedLocked(fixture.home, matchId)
  const awayLocked = isSeedLocked(fixture.away, matchId)
  const matchNumber = MATCH_NUMBER_BY_BRACKET[matchId]
  const result = useOfficialMatchResult(matchNumber ?? -1)

  return (
    <div className={`match-card flex flex-col ${hasWinner ? 'winner-set' : ''}`}>
      <KnockoutTeamRow
        teamId={homeId}
        label={seedLabel(fixture.home)}
        scoreLabel={result ? formatTeamMatchScore(result, 'home') : undefined}
        isWinner={hasWinner && winner === homeId}
        dimmed={hasWinner && winner !== homeId}
        canClick={homeId !== null ? bothKnown : true}
        showLock={homeId !== null ? (homeLocked || winnerLocked) : homeLocked}
        pickDisabled={bothKnown ? winnerLocked : homeLocked}
        onClick={homeId !== null && bothKnown
          ? () => onWinnerPick(matchId, homeId)
          : () => onSlotClick(matchId, 'home')}
        onClear={homeId !== null && !homeLocked ? () => bracketStore.getState().clearTeam(homeId) : undefined}
      />
      <div className="match-divider" />
      <KnockoutTeamRow
        teamId={awayId}
        label={seedLabel(fixture.away)}
        scoreLabel={result ? formatTeamMatchScore(result, 'away') : undefined}
        isWinner={hasWinner && winner === awayId}
        dimmed={hasWinner && winner !== awayId}
        canClick={awayId !== null ? bothKnown : true}
        showLock={awayId !== null ? (awayLocked || winnerLocked) : awayLocked}
        pickDisabled={bothKnown ? winnerLocked : awayLocked}
        onClick={awayId !== null && bothKnown
          ? () => onWinnerPick(matchId, awayId)
          : () => onSlotClick(matchId, 'away')}
        onClear={awayId !== null && !awayLocked ? () => bracketStore.getState().clearTeam(awayId) : undefined}
      />
    </div>
  )
}
