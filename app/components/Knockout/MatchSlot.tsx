import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { BRACKET_TREE, R32_FIXTURES } from '../../data/teams'
import type { MatchId, SeedSource } from '../../data/teams'
import { CONFIRMED_MATCHES } from '../../data/confirmed'
import { LIVE_RESULTS } from '../../data/liveResults'
import { MATCH_NUMBER_BY_BRACKET } from '../../lib/knockoutParticipants'
import { formatTeamMatchScore } from '../../lib/matchScore'
import { runtimeResultsStore, useOfficialMatchResult } from '../../lib/runtimeResults'
import { KnockoutTeamRow } from './KnockoutTeamRow'

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
  return childId.replace('r16_m', 'R16-').replace('qf_m', 'QF-').replace('sf_m', 'SF-')
}

interface Props {
  matchId: MatchId
  onSlotClick: (matchId: MatchId, side: 'home' | 'away') => void
  onWinnerPick: (matchId: MatchId, teamId: string) => void
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
  const matchNumber = MATCH_NUMBER_BY_BRACKET[matchId]
  const result = useOfficialMatchResult(matchNumber ?? -1)

  return (
    <div className={`match-card flex flex-col ${hasWinner ? 'winner-set' : ''}`}>
      <KnockoutTeamRow
        teamId={homeId}
        label={homeLabel}
        scoreLabel={result ? formatTeamMatchScore(result, 'home') : undefined}
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
      <KnockoutTeamRow
        teamId={awayId}
        label={awayLabel}
        scoreLabel={result ? formatTeamMatchScore(result, 'away') : undefined}
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
