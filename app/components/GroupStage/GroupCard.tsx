import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { groupScoreStore } from '../../store/groupScoreStore'
import { getGroup, TEAMS } from '../../data/teams'
import { computeStandings, isGroupComplete, getGroupMatches } from '../../lib/standings'
import { GroupScoreModal } from './GroupScoreModal'
import type { GroupKey } from '../../data/teams'

interface Props { groupKey: GroupKey }

export function GroupCard({ groupKey }: Props) {
  const teams    = getGroup(groupKey)
  const pick     = useStore(bracketStore, s => s.groups[groupKey])
  const scores   = useStore(groupScoreStore, s => s.scores)
  const overrides = useStore(groupScoreStore, s => s.overrides)
  const activeModal = useStore(groupScoreStore, s => s.activeGroupModal)
  const { setGroupFirst, setGroupSecond, setGroupThird, setThirdRank } = bracketStore.getState()
  const showScores = activeModal === groupKey

  // Build nameToId override map for standings
  const nameToId: Record<string, string> = {}
  for (const team of teams) {
    const ov = overrides[team.id]
    if (ov) nameToId[ov.name] = team.id
  }

  const standings = computeStandings(groupKey, scores, nameToId)
  const complete  = isGroupComplete(groupKey, scores)
  const matchNums = getGroupMatches(groupKey).map(m => m.matchNumber)
  const hasAnyScore = matchNums.some(n => scores[n]?.home != null || scores[n]?.away != null)

  function handleTeamClick(teamId: string) {
    if (complete) return  // standings-driven; don't allow manual override when scores set
    if (pick.first === teamId)  { setGroupFirst(groupKey, null); return }
    if (pick.second === teamId) { setGroupSecond(groupKey, null); return }
    if (pick.third === teamId)  { setGroupThird(groupKey, null); return }
    if (!pick.first)        setGroupFirst(groupKey, teamId)
    else if (!pick.second)  setGroupSecond(groupKey, teamId)
    else if (!pick.third)   setGroupThird(groupKey, teamId)
    else                    setGroupFirst(groupKey, teamId)
  }

  const isComplete = complete || (pick.first !== null && pick.second !== null)

  return (
    <>
      <div className={`rounded-lg border p-4 ${isComplete ? 'border-green-700 bg-gray-800' : 'border-gray-700 bg-gray-900'}`}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-sm">Group {groupKey}</h3>
          <div className="flex items-center gap-2">
            {isComplete && <span className="text-xs text-green-400">✓</span>}
            <button
              className={`text-xs px-2 py-0.5 rounded ${
                hasAnyScore
                  ? 'bg-blue-700 hover:bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              onClick={() => groupScoreStore.getState().setActiveGroupModal(groupKey)}
            >
              {hasAnyScore ? '📊 Scores' : '+ Scores'}
            </button>
          </div>
        </div>

        {complete ? (
          /* Standings-driven mode: show ranked list */
          <div className="space-y-1 mb-3">
            {standings.map((row, i) => {
              const team = teams.find(t => t.id === row.teamId)
              const ov   = overrides[row.teamId]
              const pos  = i === 0 ? 'text-yellow-400 bg-yellow-900/30' :
                           i === 1 ? 'text-blue-400 bg-blue-900/30' :
                           i === 2 ? 'text-green-400 bg-green-900/20' : 'text-gray-500'
              return (
                <div key={row.teamId} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${pos}`}>
                  <span className="w-4 text-xs opacity-60">{i + 1}</span>
                  <span className={`fi fi-${ov?.flagCode ?? team?.flagCode}`} />
                  <span className="flex-1">{ov?.name ?? team?.name}</span>
                  <span className="text-xs opacity-75 font-bold">{row.points}pts</span>
                  <span className="text-xs opacity-50">{row.gd > 0 ? '+' : ''}{row.gd}</span>
                </div>
              )
            })}
          </div>
        ) : (
          /* Manual pick mode */
          <div className="space-y-2 mb-3">
            {teams.map(team => {
              const isFirst  = pick.first  === team.id
              const isSecond = pick.second === team.id
              const isThird  = pick.third  === team.id
              const ov = overrides[team.id]
              return (
                <button
                  key={team.id}
                  onClick={() => handleTeamClick(team.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                    isFirst  ? 'bg-yellow-600 text-white' :
                    isSecond ? 'bg-blue-700 text-white' :
                    isThird  ? 'bg-green-800 text-white' :
                    'bg-gray-800 hover:bg-gray-700 text-gray-200'
                  }`}
                >
                  <span className={`fi fi-${ov?.flagCode ?? team.flagCode}`} />
                  <span className="flex-1 text-left">{ov?.name ?? team.name}</span>
                  {team.placeholder && !ov && <span className="text-xs opacity-40 italic">TBD</span>}
                  {isFirst  && <span className="text-xs opacity-75">1st</span>}
                  {isSecond && <span className="text-xs opacity-75">2nd</span>}
                  {isThird  && <span className="text-xs opacity-75">3rd</span>}
                </button>
              )
            })}
          </div>
        )}

        {!complete && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <label htmlFor={`rank-${groupKey}`}>3rd rank:</label>
            <select
              id={`rank-${groupKey}`}
              value={pick.thirdRank ?? ''}
              onChange={e => setThirdRank(groupKey, e.target.value ? Number(e.target.value) : null)}
              className="bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-gray-300"
            >
              <option value="">—</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {showScores && (
        <GroupScoreModal groupKey={groupKey} onClose={() => groupScoreStore.getState().setActiveGroupModal(null)} />
      )}
    </>
  )
}
