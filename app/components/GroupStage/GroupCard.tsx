import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { getGroup } from '../../data/teams'
import type { GroupKey } from '../../data/teams'

interface Props { groupKey: GroupKey }

export function GroupCard({ groupKey }: Props) {
  const teams = getGroup(groupKey)
  const pick = useStore(bracketStore, s => s.groups[groupKey])
  const { setGroupFirst, setGroupSecond, setThirdRank } = bracketStore.getState()

  function handleTeamClick(teamId: string) {
    if (pick.first === teamId) {
      setGroupFirst(groupKey, null)
      return
    }
    if (pick.second === teamId) {
      setGroupSecond(groupKey, null)
      return
    }
    if (!pick.first) {
      setGroupFirst(groupKey, teamId)
    } else if (!pick.second) {
      setGroupSecond(groupKey, teamId)
    } else {
      // Replace first pick
      setGroupFirst(groupKey, teamId)
    }
  }

  const isComplete = pick.first !== null && pick.second !== null

  return (
    <div className={`rounded-lg border p-4 ${isComplete ? 'border-green-700 bg-gray-800' : 'border-gray-700 bg-gray-900'}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm">Group {groupKey}</h3>
        {isComplete && <span className="text-xs text-green-400">✓</span>}
      </div>

      <div className="space-y-2 mb-3">
        {teams.map(team => {
          const isFirst = pick.first === team.id
          const isSecond = pick.second === team.id
          return (
            <button
              key={team.id}
              onClick={() => handleTeamClick(team.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                isFirst ? 'bg-yellow-600 text-white' :
                isSecond ? 'bg-blue-700 text-white' :
                'bg-gray-800 hover:bg-gray-700 text-gray-200'
              }`}
            >
              <span className={`fi fi-${team.flagCode}`} />
              <span className="flex-1 text-left">{team.name}</span>
              {isFirst && <span className="text-xs opacity-75">1st</span>}
              {isSecond && <span className="text-xs opacity-75">2nd</span>}
            </button>
          )
        })}
      </div>

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
    </div>
  )
}
