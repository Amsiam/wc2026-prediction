import { useState } from 'react'
import { useStore } from 'zustand'
import { groupScoreStore } from '../../store/groupScoreStore'
import { bracketStore } from '../../store/bracketStore'
import { getGroupMatches, computeStandings, isGroupComplete } from '../../lib/standings'
import { getGroup, TEAMS } from '../../data/teams'
import type { GroupKey } from '../../data/teams'

interface Props {
  groupKey: GroupKey
  onClose: () => void
}

export function GroupScoreModal({ groupKey, onClose }: Props) {
  const scores    = useStore(groupScoreStore, s => s.scores)
  const overrides = useStore(groupScoreStore, s => s.overrides)
  const { setScore, setOverride } = groupScoreStore.getState()
  const matches = getGroupMatches(groupKey)
  const teams   = getGroup(groupKey)

  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [editName, setEditName]           = useState('')
  const [editFlag, setEditFlag]           = useState('')

  /** Resolve display name for a schedule team name */
  function displayName(scheduleName: string) {
    const team = TEAMS.find(t => t.name === scheduleName)
    if (team && overrides[team.id]) return overrides[team.id].name
    return scheduleName
  }

  /** Name-to-id map for standings (overrides map name → id) */
  const nameToId: Record<string, string> = {}
  for (const team of teams) {
    const ov = overrides[team.id]
    if (ov) nameToId[ov.name] = team.id
  }

  const standings  = computeStandings(groupKey, scores, nameToId)
  const complete   = isGroupComplete(groupKey, scores)

  function handleScoreChange(matchNumber: number, side: 'home' | 'away', raw: string) {
    const val  = raw === '' ? null : Math.max(0, Math.min(30, parseInt(raw) || 0))
    const prev = scores[matchNumber] ?? { home: null, away: null }
    setScore(matchNumber, side === 'home' ? val : prev.home, side === 'away' ? val : prev.away)
  }

  function applyStandingsToStore() {
    if (!complete) return
    const store = bracketStore.getState()
    store.setGroupFirst(groupKey,  standings[0]?.teamId ?? null)
    store.setGroupSecond(groupKey, standings[1]?.teamId ?? null)
    store.setGroupThird(groupKey,  standings[2]?.teamId ?? null)
    onClose()
  }

  function startEdit(teamId: string) {
    const ov = overrides[teamId]
    setEditName(ov?.name ?? TEAMS.find(t => t.id === teamId)?.name ?? '')
    setEditFlag(ov?.flagCode ?? '')
    setEditingTeamId(teamId)
  }

  function saveEdit() {
    if (!editingTeamId) return
    if (editName.trim()) {
      setOverride(editingTeamId, { name: editName.trim(), flagCode: editFlag.trim() || 'un' })
    } else {
      setOverride(editingTeamId, null)
    }
    setEditingTeamId(null)
  }

  const POSITION_COLORS = ['text-yellow-400', 'text-blue-400', 'text-green-400', 'text-gray-400']

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 overflow-y-auto py-6" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="font-bold text-base">Group {groupKey} — Scores</h2>
          <button className="text-gray-500 hover:text-white text-xl leading-none" onClick={onClose}>×</button>
        </div>

        {/* Placeholder team editors */}
        {teams.some(t => t.placeholder) && (
          <div className="px-5 py-3 border-b border-gray-800">
            <p className="text-xs text-gray-500 mb-2">Update confirmed teams:</p>
            <div className="flex flex-col gap-1.5">
              {teams.filter(t => t.placeholder).map(team => {
                const ov = overrides[team.id]
                return editingTeamId === team.id ? (
                  <div key={team.id} className="flex gap-2 items-center">
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Team name"
                      className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                    />
                    <input
                      value={editFlag}
                      onChange={e => setEditFlag(e.target.value)}
                      placeholder="flag (e.g. tr)"
                      className="w-24 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                    />
                    <button className="text-green-400 text-sm px-2 py-1 rounded hover:bg-gray-800" onClick={saveEdit}>Save</button>
                    <button className="text-gray-500 text-sm px-2 py-1 rounded hover:bg-gray-800" onClick={() => setEditingTeamId(null)}>Cancel</button>
                  </div>
                ) : (
                  <div key={team.id} className="flex items-center gap-2">
                    <span className={`fi fi-${ov?.flagCode ?? team.flagCode}`} />
                    <span className="text-sm text-gray-300 flex-1">{ov?.name ?? team.name}</span>
                    <button
                      className="text-xs text-blue-400 hover:text-blue-300"
                      onClick={() => startEdit(team.id)}
                    >
                      {ov ? 'Edit' : 'Set team'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Match score inputs */}
        <div className="px-5 py-3 border-b border-gray-800">
          <p className="text-xs text-gray-500 mb-2">Match results:</p>
          <div className="flex flex-col gap-2">
            {matches.map(m => {
              const score = scores[m.matchNumber] ?? { home: null, away: null }
              return (
                <div key={m.matchNumber} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 w-8 text-right shrink-0">M{m.matchNumber}</span>
                  <span className="flex-1 text-right truncate text-gray-200">{displayName(m.homeTeam)}</span>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={score.home ?? ''}
                    onChange={e => handleScoreChange(m.matchNumber, 'home', e.target.value)}
                    className="w-12 text-center bg-gray-800 border border-gray-700 rounded py-1 text-white"
                    placeholder="—"
                  />
                  <span className="text-gray-500">–</span>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={score.away ?? ''}
                    onChange={e => handleScoreChange(m.matchNumber, 'away', e.target.value)}
                    className="w-12 text-center bg-gray-800 border border-gray-700 rounded py-1 text-white"
                    placeholder="—"
                  />
                  <span className="flex-1 truncate text-gray-200">{displayName(m.awayTeam)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Live standings */}
        <div className="px-5 py-3 border-b border-gray-800">
          <p className="text-xs text-gray-500 mb-2">Standings:</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left w-5">#</th>
                <th className="text-left">Team</th>
                <th className="text-right w-8">P</th>
                <th className="text-right w-8">W</th>
                <th className="text-right w-8">D</th>
                <th className="text-right w-8">L</th>
                <th className="text-right w-10">GD</th>
                <th className="text-right w-10 font-bold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, i) => {
                const team = TEAMS.find(t => t.id === row.teamId)
                const ov   = overrides[row.teamId]
                return (
                  <tr key={row.teamId} className={`${POSITION_COLORS[i] ?? 'text-gray-400'}`}>
                    <td className="py-0.5">{i + 1}</td>
                    <td className="py-0.5 flex items-center gap-1.5">
                      <span className={`fi fi-${ov?.flagCode ?? team?.flagCode}`} />
                      {ov?.name ?? team?.name}
                    </td>
                    <td className="text-right">{row.played}</td>
                    <td className="text-right">{row.won}</td>
                    <td className="text-right">{row.drawn}</td>
                    <td className="text-right">{row.lost}</td>
                    <td className="text-right">{row.gd > 0 ? '+' : ''}{row.gd}</td>
                    <td className="text-right font-bold">{row.points}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded text-sm text-gray-400 hover:text-white"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded text-sm font-semibold ${
              complete
                ? 'bg-green-700 hover:bg-green-600 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            onClick={applyStandingsToStore}
            disabled={!complete}
          >
            {complete ? 'Apply Results to Bracket' : 'Enter all scores first'}
          </button>
        </div>
      </div>
    </div>
  )
}
