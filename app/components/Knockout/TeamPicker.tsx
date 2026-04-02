import { bracketStore } from '../../store/bracketStore'
import { getEligibleTeams } from '../../lib/eligible'
import type { MatchId, Team } from '../../data/teams'

interface Props {
  matchId: MatchId
  teams?: Team[]  // if provided, use this instead of computing from matchId
  onSelect: (team: Team) => void
  onClose: () => void
}

export function TeamPicker({ matchId, teams, onSelect, onClose }: Props) {
  const state = bracketStore.getState()
  const eligible = teams ?? getEligibleTeams(matchId, state)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl p-4 w-80 max-h-[70vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Select team</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none">×</button>
        </div>
        {eligible.length === 0 ? (
          <p className="text-gray-400 text-sm">No eligible teams. Complete the Group Stage first.</p>
        ) : (
          <ul className="space-y-1">
            {eligible.map(team => (
              <li key={team.id}>
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 text-left transition-colors"
                  onClick={() => onSelect(team)}
                >
                  <span className={`fi fi-${team.flagCode} flex-shrink-0`} />
                  <span>{team.name}</span>
                  <span className="ml-auto text-xs text-gray-500">Group {team.group}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
