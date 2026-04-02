import { useState, useMemo } from 'react'
import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { MatchSlot } from './MatchSlot'
import { R32MatchSlot } from './R32MatchSlot'
import { TeamPicker } from './TeamPicker'
import { ThirdPlaceSlot } from './ThirdPlaceSlot'
import { getTeamById, BRACKET_TREE, R32_FIXTURES } from '../../data/teams'
import { getSlotPool, getR32SlotPool, inferTeamR32Entry, getR32Ancestors } from '../../lib/bracket'
import type { MatchId, Team, GroupKey, SeedSource } from '../../data/teams'

interface DisambigOption {
  r32Id: MatchId
  positionLabel: string
  opponentLabel: string
}

type PickingState =
  | { phase: 'idle' }
  | { phase: 'slot'; matchId: MatchId; slotSide: 'home' | 'away' }
  | { phase: 'disambig'; team: Team; matchId: MatchId; slotSide: 'home' | 'away'; options: DisambigOption[] }

function seedLabel(seed: SeedSource): string {
  if (seed.source === 'winner') return `1st Group ${seed.group}`
  if (seed.source === 'runner') return `2nd Group ${seed.group}`
  return `3rd (${seed.groups!.join('/')})`
}

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

function RoundColumn({ matchIds, label, onSlotClick, onWinnerPick }: {
  matchIds: MatchId[]
  label: string
  onSlotClick: (id: MatchId, side: 'home' | 'away') => void
  onWinnerPick: (id: MatchId, teamId: string) => void
}) {
  const isR32 = matchIds[0]?.startsWith('r32')
  return (
    <div className="flex flex-col justify-around gap-3 min-w-45">
      <div className="text-xs text-gray-500 text-center font-medium">{label}</div>
      {matchIds.map(id => (
        isR32
          ? <R32MatchSlot key={id} matchId={id} onSlotClick={onSlotClick} onWinnerPick={onWinnerPick} />
          : <MatchSlot key={id} matchId={id} onSlotClick={onSlotClick} onWinnerPick={onWinnerPick} />
      ))}
    </div>
  )
}

export function BracketView() {
  const [picking, setPicking] = useState<PickingState>({ phase: 'idle' })
  const finalWinner = useStore(bracketStore, s => s.matches.final?.winner)
  const champion = finalWinner ? getTeamById(finalWinner) : null

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

  function handleSlotClick(matchId: MatchId, slotSide: 'home' | 'away') {
    setPicking({ phase: 'slot', matchId, slotSide })
  }

  function handleWinnerPick(matchId: MatchId, teamId: string) {
    const current = bracketStore.getState().matches[matchId]?.winner
    bracketStore.getState().clearDownstream(matchId)
    bracketStore.getState().setMatchWinner(matchId, current === teamId ? null : teamId)
  }

  function handleTeamPick(team: Team) {
    if (picking.phase !== 'slot') return
    const { matchId, slotSide } = picking

    if (!matchId.startsWith('r32')) {
      const children = (BRACKET_TREE as Record<string, readonly string[]>)[matchId]
      if (children) {
        const childId = children[slotSide === 'home' ? 0 : 1] as MatchId
        const state = bracketStore.getState()
        const r32Ids = childId.startsWith('r32') ? [childId as MatchId] : getR32Ancestors(childId)

        // If team already won an R32 match in this subtree, path is determined — no disambiguation needed
        const determinedR32 = r32Ids.find(id => state.matches[id]?.winner === team.id)
        if (determinedR32) {
          commitSlotFill(matchId, slotSide, team, determinedR32)
          return
        }

        // Build all possible R32 entry options (any position) filtered by assigned group position
        const gp = state.groups[team.group as GroupKey]
        const options: DisambigOption[] = []
        for (const r32Id of r32Ids) {
          const f = R32_FIXTURES.find(f => f.id === r32Id)
          if (!f) continue
          // Home slot (winner or runner)
          if (f.home.source !== 'third' && f.home.group === (team.group as GroupKey)) {
            const pos = f.home.source === 'winner' ? 'first' : 'second'
            const other = pos === 'first' ? 'second' : 'first'
            if (!gp || (gp.third !== team.id && gp[other] !== team.id))
              options.push({ r32Id, positionLabel: pos === 'first' ? '1st place' : '2nd place', opponentLabel: seedLabel(f.away) })
          }
          // Away slot (winner or runner)
          if (f.away.source !== 'third' && f.away.group === (team.group as GroupKey)) {
            const pos = f.away.source === 'winner' ? 'first' : 'second'
            const other = pos === 'first' ? 'second' : 'first'
            if (!gp || (gp.third !== team.id && gp[other] !== team.id))
              options.push({ r32Id, positionLabel: pos === 'first' ? '1st place' : '2nd place', opponentLabel: seedLabel(f.home) })
          }
          // Away third-place slot
          if (f.away.source === 'third' && (f.away.groups ?? []).includes(team.group as GroupKey)) {
            const eligible = !gp || (gp.first !== team.id && gp.second !== team.id &&
              (gp.thirdSlot === null || gp.thirdSlot === r32Id))
            if (eligible)
              options.push({ r32Id, positionLabel: '3rd place', opponentLabel: seedLabel(f.home) })
          }
        }

        if (options.length > 1) {
          setPicking({ phase: 'disambig', team, matchId, slotSide, options })
          return
        }
      }
    }

    commitSlotFill(matchId, slotSide, team)
  }

  function handleDisambig(r32Id: MatchId) {
    if (picking.phase !== 'disambig') return
    commitSlotFill(picking.matchId, picking.slotSide, picking.team, r32Id)
  }

  function commitSlotFill(matchId: MatchId, slotSide: 'home' | 'away', team: Team, r32IdOverride?: MatchId) {
    const children = (BRACKET_TREE as Record<string, readonly string[]>)[matchId]
    const store = bracketStore.getState()

    if (!children) {
      // matchId is an R32 match — fill group position only
      const fixture = R32_FIXTURES.find(f => f.id === matchId)
      if (!fixture) { setPicking({ phase: 'idle' }); return }
      const seed = slotSide === 'home' ? fixture.home : fixture.away
      if (seed.source === 'winner') store.setGroupFirst(seed.group! as GroupKey, team.id)
      else if (seed.source === 'runner') store.setGroupSecond(seed.group! as GroupKey, team.id)
      else { store.setGroupThird(team.group as GroupKey, team.id); store.setGroupThirdSlot(team.group as GroupKey, matchId) }
      setPicking({ phase: 'idle' })
      return
    }

    const childId = children[slotSide === 'home' ? 0 : 1] as MatchId
    const rawEntry = inferTeamR32Entry(team, childId)
    if (!rawEntry) { setPicking({ phase: 'idle' }); return }

    // If a specific R32 slot was chosen, derive the correct position from that fixture
    let entry = rawEntry
    if (r32IdOverride) {
      const f = R32_FIXTURES.find(f => f.id === r32IdOverride)
      if (f) {
        if (f.home.source !== 'third' && f.home.group === (team.group as GroupKey))
          entry = { r32Id: r32IdOverride, position: f.home.source === 'winner' ? 'first' : 'second', group: team.group as GroupKey }
        else if (f.away.source !== 'third' && f.away.group === (team.group as GroupKey))
          entry = { r32Id: r32IdOverride, position: f.away.source === 'winner' ? 'first' : 'second', group: team.group as GroupKey }
        else
          entry = { r32Id: r32IdOverride, position: 'third', group: team.group as GroupKey }
      }
    }

    // Clear child's winner + downstream
    store.clearDownstream(childId)
    store.setMatchWinner(childId, null)

    // Set group position
    if (entry.position === 'first') store.setGroupFirst(entry.group, team.id)
    else if (entry.position === 'second') store.setGroupSecond(entry.group, team.id)
    else { store.setGroupThird(entry.group, team.id); store.setGroupThirdSlot(entry.group, entry.r32Id) }

    // Backward fill: from R32 entry up to childId
    const path = findPath(entry.r32Id, childId)
    if (path) {
      for (const id of path) store.setMatchWinner(id, team.id)
    } else {
      store.setMatchWinner(entry.r32Id, team.id)
    }

    setPicking({ phase: 'idle' })
  }

  const slotPool = useMemo(() => {
    if (picking.phase !== 'slot') return []
    const state = bracketStore.getState()
    const { matchId, slotSide } = picking
    if (matchId.startsWith('r32')) {
      return getR32SlotPool(matchId, slotSide, state)
    }
    return getSlotPool(matchId, slotSide, state)
  }, [picking])

  return (
    <div className="overflow-x-auto pb-8">
      <div className="flex items-start gap-2 min-w-max mx-auto px-4 pt-4">
        {LEFT_ROUNDS.map((ids, i) => (
          <RoundColumn key={i} matchIds={ids} label={ROUND_LABELS[i]} onSlotClick={handleSlotClick} onWinnerPick={handleWinnerPick} />
        ))}

        <div className="flex flex-col items-center gap-2 px-4 pt-6">
          <div className="text-xs text-gray-500 font-medium text-center">Final</div>
          <MatchSlot matchId="final" onSlotClick={handleSlotClick} onWinnerPick={handleWinnerPick} />
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
          <RoundColumn key={i} matchIds={ids} label={ROUND_LABELS[3 - i]} onSlotClick={handleSlotClick} onWinnerPick={handleWinnerPick} />
        ))}
      </div>

      <div className="mt-8 flex justify-center gap-4 items-center">
        <span className="text-xs text-gray-400">3rd Place Play-off</span>
        <ThirdPlaceSlot onWinnerPick={handleWinnerPick} />
      </div>

      {picking.phase === 'slot' && (
        <TeamPicker
          matchId={picking.matchId}
          teams={slotPool}
          onSelect={handleTeamPick}
          onClose={() => setPicking({ phase: 'idle' })}
        />
      )}

      {picking.phase === 'disambig' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setPicking({ phase: 'idle' })}>
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl p-4 w-80 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-1">
              <h2 className="font-semibold text-sm">How did {picking.team.name} qualify?</h2>
              <button onClick={() => setPicking({ phase: 'idle' })} className="text-gray-400 hover:text-white text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-gray-500 mb-3">Group {picking.team.group} has multiple possible paths</p>
            <ul className="space-y-1">
              {picking.options.map((opt, i) => (
                <li key={i}>
                  <button
                    className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-gray-700 text-left transition-colors text-sm"
                    onClick={() => handleDisambig(opt.r32Id)}
                  >
                    <div className="flex flex-col">
                      <span className="text-gray-300">{opt.positionLabel}</span>
                      <span className="text-xs text-gray-500">vs {opt.opponentLabel}</span>
                    </div>
                    <span className="text-xs text-gray-600">{opt.r32Id.replace('r32_m', 'R32-')}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
