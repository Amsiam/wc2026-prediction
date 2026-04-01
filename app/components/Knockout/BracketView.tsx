import { useState } from 'react'
import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { MatchSlot } from './MatchSlot'
import { TeamPicker } from './TeamPicker'
import { GroupPositionModal } from './GroupPositionModal'
import { getTeamById, BRACKET_TREE, R32_FIXTURES } from '../../data/teams'
import type { MatchId, Team, GroupKey } from '../../data/teams'

type PickingState =
  | { phase: 'idle' }
  | { phase: 'picking'; matchId: MatchId }
  | { phase: 'position'; matchId: MatchId; team: Team }

const LEFT_ROUNDS: MatchId[][] = [
  ['r32_m1','r32_m2','r32_m3','r32_m4','r32_m5','r32_m6','r32_m7','r32_m8'],
  ['r16_m1','r16_m2','r16_m3','r16_m4'],
  ['qf_m1','qf_m2'],
  ['sf_m1'],
]
const RIGHT_ROUNDS: MatchId[][] = [
  ['r32_m9','r32_m10','r32_m11','r32_m12','r32_m13','r32_m14','r32_m15','r32_m16'],
  ['r16_m5','r16_m6','r16_m7','r16_m8'],
  ['qf_m3','qf_m4'],
  ['sf_m2'],
]
const ROUND_LABELS = ['Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals']

function RoundColumn({ matchIds, label, onSlotClick }: { matchIds: MatchId[]; label: string; onSlotClick: (id: MatchId) => void }) {
  return (
    <div className="flex flex-col justify-around gap-3 min-w-45">
      <div className="text-xs text-gray-500 text-center font-medium">{label}</div>
      {matchIds.map(id => (
        <MatchSlot key={id} matchId={id} onSlotClick={onSlotClick} />
      ))}
    </div>
  )
}

export function BracketView() {
  const [picking, setPicking] = useState<PickingState>({ phase: 'idle' })
  const finalWinner = useStore(bracketStore, s => s.matches.final.winner)
  const champion = finalWinner ? getTeamById(finalWinner) : null

  function handleSlotClick(matchId: MatchId) {
    setPicking({ phase: 'picking', matchId })
  }

  function handleTeamSelect(team: Team) {
    if (picking.phase !== 'picking') return
    const { matchId } = picking
    const state = bracketStore.getState()
    const groupPick = state.groups[team.group as GroupKey]
    const positionKnown = groupPick?.first === team.id || groupPick?.second === team.id

    if (!positionKnown) {
      setPicking({ phase: 'position', matchId, team })
      return
    }
    commitPick(matchId, team)
  }

  function handlePositionSelect(position: 'first' | 'second') {
    if (picking.phase !== 'position') return
    const { matchId, team } = picking
    const { setGroupFirst, setGroupSecond } = bracketStore.getState()
    if (position === 'first') setGroupFirst(team.group as GroupKey, team.id)
    else setGroupSecond(team.group as GroupKey, team.id)
    commitPick(matchId, team)
  }

  function findPath(from: MatchId, to: MatchId): MatchId[] | null {
    if (from === to) return [from]
    if (to.startsWith('r32')) return null
    const children = (BRACKET_TREE as Record<string, readonly [string, string]>)[to]
    if (!children) return null
    for (const child of children) {
      const sub = findPath(from, child as MatchId)
      if (sub) return [...sub, to]
    }
    return null
  }

  function commitPick(matchId: MatchId, team: Team) {
    const state = bracketStore.getState()
    const groupPick = state.groups[team.group as GroupKey]

    bracketStore.getState().clearDownstream(matchId)

    // Determine the correct R32 match for this team based on known position
    let r32Id: MatchId | undefined
    if (groupPick?.first === team.id) {
      const fixture = R32_FIXTURES.find(f =>
        (f.home.source === 'winner' && f.home.group === team.group) ||
        (f.away.source === 'winner' && f.away.group === team.group)
      )
      r32Id = fixture?.id as MatchId | undefined
    } else if (groupPick?.second === team.id) {
      const fixture = R32_FIXTURES.find(f =>
        (f.home.source === 'runner' && f.home.group === team.group) ||
        (f.away.source === 'runner' && f.away.group === team.group)
      )
      r32Id = fixture?.id as MatchId | undefined
    }

    if (r32Id) {
      const path = findPath(r32Id, matchId)
      if (path) {
        const { setMatchWinner } = bracketStore.getState()
        for (const id of path) setMatchWinner(id, team.id)
        setPicking({ phase: 'idle' })
        return
      }
    }

    // Fallback (3rd-place qualifier or position unknown): basic backfill
    bracketStore.getState().backfillPath(matchId, team.id, 'home')
    setPicking({ phase: 'idle' })
  }

  return (
    <div className="overflow-x-auto pb-8">
      <div className="flex items-start gap-2 min-w-max mx-auto px-4 pt-4">
        {LEFT_ROUNDS.map((ids, i) => (
          <RoundColumn key={i} matchIds={ids} label={ROUND_LABELS[i]} onSlotClick={handleSlotClick} />
        ))}

        <div className="flex flex-col items-center gap-2 px-4 pt-6">
          <div className="text-xs text-gray-500 font-medium text-center">Final</div>
          <MatchSlot matchId="final" onSlotClick={handleSlotClick} />
          {champion && (
            <div className="mt-2 text-center">
              <div className="text-xs text-yellow-400 mb-1">Champion</div>
              <div className="flex items-center gap-2 justify-center">
                <span className={`fi fi-${champion.flagCode}`} />
                <span className="text-sm font-bold">{champion.name}</span>
              </div>
            </div>
          )}
        </div>

        {[...RIGHT_ROUNDS].reverse().map((ids, i) => (
          <RoundColumn key={i} matchIds={ids} label={ROUND_LABELS[3 - i]} onSlotClick={handleSlotClick} />
        ))}
      </div>

      <div className="mt-8 flex justify-center gap-4 items-center">
        <span className="text-xs text-gray-400">3rd Place Play-off</span>
        <MatchSlot matchId="third_place" onSlotClick={handleSlotClick} />
      </div>

      {picking.phase === 'picking' && (
        <TeamPicker
          matchId={picking.matchId}
          onSelect={handleTeamSelect}
          onClose={() => setPicking({ phase: 'idle' })}
        />
      )}
      {picking.phase === 'position' && (
        <GroupPositionModal
          team={picking.team}
          onSelect={handlePositionSelect}
          onClose={() => setPicking({ phase: 'idle' })}
        />
      )}
    </div>
  )
}
