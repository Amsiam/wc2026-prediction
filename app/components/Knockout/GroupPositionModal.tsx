import { useState } from 'react'
import type { Team, MatchId } from '../../data/teams'
import type { SlotDescriptor } from '../../lib/bracket'

interface Props {
  team: Team
  validOptions: ('first' | 'second' | 'third')[]
  thirdSlotOptions: SlotDescriptor[]
  onSelect: (position: 'first' | 'second' | 'third', r32Id?: MatchId) => void
  onClose: () => void
}

const LABELS: Record<'first' | 'second' | 'third', string> = {
  first:  '1st place',
  second: '2nd place',
  third:  '3rd place',
}

const COLORS: Record<'first' | 'second' | 'third', string> = {
  first:  'bg-yellow-600 hover:bg-yellow-500',
  second: 'bg-blue-700 hover:bg-blue-600',
  third:  'bg-green-700 hover:bg-green-600',
}

export function GroupPositionModal({ team, validOptions, thirdSlotOptions, onSelect, onClose }: Props) {
  const [pickingThirdSlot, setPickingThirdSlot] = useState(false)

  function handlePosition(pos: 'first' | 'second' | 'third') {
    if (pos === 'third' && thirdSlotOptions.length > 1) {
      setPickingThirdSlot(true)
      return
    }
    onSelect(pos, pos === 'third' ? thirdSlotOptions[0]?.r32Id : undefined)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-80 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {!pickingThirdSlot ? (
          <>
            <p className="text-sm text-gray-300 mb-4">
              How did{' '}
              <span className={`fi fi-${team.flagCode}`} />{' '}
              <span className="font-bold text-white">{team.name}</span>{' '}
              finish in Group {team.group}?
            </p>
            <div className="flex gap-2">
              {validOptions.map(pos => (
                <button
                  key={pos}
                  className={`flex-1 py-2 rounded font-semibold text-sm ${COLORS[pos]}`}
                  onClick={() => handlePosition(pos)}
                >
                  {LABELS[pos]}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-300 mb-4">
              Which R32 match does{' '}
              <span className="font-bold text-white">{team.name}</span>{' '}
              enter as a 3rd-place qualifier?
            </p>
            <div className="flex flex-col gap-2">
              {thirdSlotOptions.map(slot => (
                <button
                  key={slot.r32Id}
                  className="py-2 px-3 rounded bg-green-800 hover:bg-green-700 text-sm text-left"
                  onClick={() => onSelect('third', slot.r32Id)}
                >
                  <span className="font-semibold">vs {slot.opponentLabel}</span>
                </button>
              ))}
            </div>
            <button
              className="mt-3 text-xs text-gray-500 hover:text-gray-300"
              onClick={() => setPickingThirdSlot(false)}
            >
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  )
}
