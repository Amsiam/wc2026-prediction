import type { Team } from '../../data/teams'

interface Props {
  team: Team
  onSelect: (position: 'first' | 'second') => void
  onClose: () => void
}

export function GroupPositionModal({ team, onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-72 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-sm text-gray-300 mb-4">
          How did{' '}
          <span className={`fi fi-${team.flagCode}`} />{' '}
          <span className="font-bold text-white">{team.name}</span>{' '}
          finish in Group {team.group}?
        </p>
        <div className="flex gap-3">
          <button
            className="flex-1 py-2 rounded bg-yellow-600 hover:bg-yellow-500 font-semibold text-sm"
            onClick={() => onSelect('first')}
          >
            1st place
          </button>
          <button
            className="flex-1 py-2 rounded bg-blue-700 hover:bg-blue-600 font-semibold text-sm"
            onClick={() => onSelect('second')}
          >
            2nd place
          </button>
        </div>
      </div>
    </div>
  )
}
