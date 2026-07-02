import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { groupScoreStore } from '../../store/groupScoreStore'
import { getGroup, TEAMS } from '../../data/teams'
import { computeStandings, isGroupComplete, getGroupMatches } from '../../lib/standings'
import { GroupScoreModal } from './GroupScoreModal'
import { TeamFlag } from '../TeamFlag'
import type { GroupKey } from '../../data/teams'

interface Props { groupKey: GroupKey }

export function GroupCard({ groupKey }: Props) {
  const teams    = getGroup(groupKey)
  const pick            = useStore(bracketStore, s => s.groups[groupKey])
  const filledThirdCount = useStore(bracketStore, s =>
    Object.values(s.groups).filter(g => g.third !== null).length
  )
  const scores      = useStore(groupScoreStore, s => s.scores)
  const discipline  = useStore(groupScoreStore, s => s.discipline)
  const teamConduct = useStore(groupScoreStore, s => s.teamConduct)
  const overrides   = useStore(groupScoreStore, s => s.overrides)
  const activeModal = useStore(groupScoreStore, s => s.activeGroupModal)
  const { setGroupFirst, setGroupSecond, setGroupThird, setThirdRank } = bracketStore.getState()
  const showScores = activeModal === groupKey

  // Build nameToId override map for standings
  const nameToId: Record<string, string> = {}
  for (const team of teams) {
    const ov = overrides[team.id]
    if (ov) nameToId[ov.name] = team.id
  }

  const standings = computeStandings(groupKey, scores, nameToId, discipline, teamConduct)
  const complete  = isGroupComplete(groupKey, scores)
  const matchNums = getGroupMatches(groupKey).map(m => m.matchNumber)
  const hasAnyScore = matchNums.some(n => scores[n]?.home != null || scores[n]?.away != null)

  function handleTeamClick(teamId: string) {
    if (pick.first === teamId)  { setGroupFirst(groupKey, null); return }
    if (pick.second === teamId) { setGroupSecond(groupKey, null); return }
    if (pick.third === teamId)  { setGroupThird(groupKey, null); return }
    if (!pick.first)        setGroupFirst(groupKey, teamId)
    else if (!pick.second)  setGroupSecond(groupKey, teamId)
    else if (!pick.third) {
      if (filledThirdCount >= 8) {
        alert('8 third-place qualifiers are already selected. Remove one before adding another.')
        return
      }
      setGroupThird(groupKey, teamId)
    }
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
              type="button"
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

        {hasAnyScore ? (
          /* Standings-driven with manual override */
          <div className="space-y-1 mb-3">
            {standings.map((row, i) => {
              const team = teams.find(t => t.id === row.teamId)
              const ov   = overrides[row.teamId]
              const isFirst  = pick.first  === row.teamId
              const isSecond = pick.second === row.teamId
              const isThird  = pick.third  === row.teamId
              const pos  = i === 0 ? 'text-yellow-400' :
                           i === 1 ? 'text-blue-400' :
                           i === 2 ? 'text-green-400' : 'text-gray-500'
              const highlight = isFirst  ? 'bg-yellow-900/40 ring-1 ring-yellow-600/50' :
                                isSecond ? 'bg-blue-900/40 ring-1 ring-blue-600/50' :
                                isThird  ? 'bg-green-900/30 ring-1 ring-green-700/50' : 'hover:bg-gray-800'
              return (
                <button
                  type="button"
                  key={row.teamId}
                  onClick={() => handleTeamClick(row.teamId)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${pos} ${highlight}`}
                >
                  <span className="w-4 text-xs opacity-60">{i + 1}</span>
                  <TeamFlag code={ov?.flagCode ?? team?.flagCode ?? ''} />
                  <span className="flex-1 text-left">{ov?.name ?? team?.name}</span>
                  <span className="text-xs opacity-75 font-bold">{row.points}pts</span>
                  <span className="text-xs opacity-50">{row.gd > 0 ? '+' : ''}{row.gd}</span>
                  {isFirst  && <span className="text-xs opacity-75">1st</span>}
                  {isSecond && <span className="text-xs opacity-75">2nd</span>}
                  {isThird  && <span className="text-xs opacity-75">3rd</span>}
                </button>
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
                  type="button"
                  key={team.id}
                  onClick={() => handleTeamClick(team.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                    isFirst  ? 'bg-yellow-600 text-white' :
                    isSecond ? 'bg-blue-700 text-white' :
                    isThird  ? 'bg-green-800 text-white' :
                    'bg-gray-800 hover:bg-gray-700 text-gray-200'
                  }`}
                >
                  <TeamFlag code={ov?.flagCode ?? team.flagCode} />
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

        {pick.third && (
          <div className="text-xs text-gray-500 mt-1">
            {pick.thirdSlot
              ? <span className="text-green-500">✓ R32 slot auto-assigned</span>
              : filledThirdCount < 8
                ? <span>R32 slot pending — {filledThirdCount}/8 third-place groups set</span>
                : <span>R32 slot unresolved — adjust 3rd-place picks</span>
            }
          </div>
        )}
      </div>

      {showScores && (
        <GroupScoreModal groupKey={groupKey} onClose={() => groupScoreStore.getState().setActiveGroupModal(null)} />
      )}
    </>
  )
}
