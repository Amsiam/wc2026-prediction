import { useState } from 'react'
import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { MatchSlot } from './MatchSlot'
import { R32MatchSlot } from './R32MatchSlot'
import { TeamPicker } from './TeamPicker'
import { GroupPositionModal } from './GroupPositionModal'
import { getTeamById, BRACKET_TREE } from '../../data/teams'
import { getValidPositions, getPossibleR32Slots } from '../../lib/bracket'
import type { MatchId, Team, GroupKey } from '../../data/teams'
import type { SlotDescriptor } from '../../lib/bracket'

type PickingState =
  | { phase: 'idle' }
  | { phase: 'picking'; matchId: MatchId }
  | {
      phase: 'position'
      matchId: MatchId
      team: Team
      validOptions: ('first' | 'second' | 'third')[]
      thirdSlotOptions: SlotDescriptor[]
    }

// P1 path (→ sf_m1): r32_m1,2,3,5 (qf_m1) + r32_m9,10,11,12 (qf_m2) on LEFT
// P2 path (→ sf_m2): r32_m4,6,7,8 (qf_m3) + r32_m13,14,15,16 (qf_m4) on RIGHT
const LEFT_ROUNDS: MatchId[][] = [
  ['r32_m1','r32_m2','r32_m3','r32_m5','r32_m9','r32_m10','r32_m11','r32_m12'],
  ['r16_m1','r16_m2','r16_m5','r16_m6'],
  ['qf_m1','qf_m2'],
  ['sf_m1'],
]
const RIGHT_ROUNDS: MatchId[][] = [
  ['r32_m4','r32_m6','r32_m7','r32_m8','r32_m13','r32_m14','r32_m15','r32_m16'],
  ['r16_m3','r16_m4','r16_m7','r16_m8'],
  ['qf_m3','qf_m4'],
  ['sf_m2'],
]
const ROUND_LABELS = ['Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals']

function RoundColumn({ matchIds, label, onSlotClick }: { matchIds: MatchId[]; label: string; onSlotClick: (id: MatchId) => void }) {
  const isR32 = matchIds[0]?.startsWith('r32')
  return (
    <div className="flex flex-col justify-around gap-3 min-w-45">
      <div className="text-xs text-gray-500 text-center font-medium">{label}</div>
      {matchIds.map(id => (
        isR32
          ? <R32MatchSlot key={id} matchId={id} onSlotClick={onSlotClick} />
          : <MatchSlot key={id} matchId={id} onSlotClick={onSlotClick} />
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
    const groupPick = bracketStore.getState().groups[team.group as GroupKey]

    // Position already recorded — commit immediately
    if (groupPick?.first === team.id)  { commitPick(matchId, team, 'first');  return }
    if (groupPick?.second === team.id) { commitPick(matchId, team, 'second'); return }
    if (groupPick?.third === team.id)  { commitPick(matchId, team, 'third');  return }

    const validOptions = getValidPositions(matchId, team.group as GroupKey)
    const thirdSlotOptions = validOptions.includes('third')
      ? getPossibleR32Slots(matchId, team.group as GroupKey, 'third')
      : []

    // Single unambiguous non-third position — skip modal
    if (validOptions.length === 1 && validOptions[0] !== 'third') {
      commitPick(matchId, team, validOptions[0])
      return
    }
    // Only third with exactly one slot — no disambiguation needed
    if (validOptions.length === 1 && validOptions[0] === 'third' && thirdSlotOptions.length === 1) {
      bracketStore.getState().setGroupThird(team.group as GroupKey, team.id)
      commitPick(matchId, team, 'third', thirdSlotOptions[0].r32Id)
      return
    }

    setPicking({ phase: 'position', matchId, team, validOptions, thirdSlotOptions })
  }

  function handlePositionSelect(position: 'first' | 'second' | 'third', r32Id?: MatchId) {
    if (picking.phase !== 'position') return
    const { matchId, team } = picking
    const store = bracketStore.getState()
    if (position === 'first')  store.setGroupFirst(team.group as GroupKey, team.id)
    if (position === 'second') store.setGroupSecond(team.group as GroupKey, team.id)
    if (position === 'third')  store.setGroupThird(team.group as GroupKey, team.id)
    commitPick(matchId, team, position, r32Id)
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

  function commitPick(
    matchId: MatchId,
    team: Team,
    position: 'first' | 'second' | 'third',
    explicitR32Id?: MatchId
  ) {
    bracketStore.getState().clearDownstream(matchId)

    let r32Id = explicitR32Id
    if (!r32Id) {
      const slots = getPossibleR32Slots(matchId, team.group as GroupKey, position)
      if (slots.length === 1) r32Id = slots[0].r32Id
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

    // Fallback: third_place match or unresolvable
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
          validOptions={picking.validOptions}
          thirdSlotOptions={picking.thirdSlotOptions}
          onSelect={handlePositionSelect}
          onClose={() => setPicking({ phase: 'idle' })}
        />
      )}
    </div>
  )
}
