import { forwardRef } from 'react'
import { getTeamById } from '../../data/teams'
import { bracketStore } from '../../store/bracketStore'
import type { MatchId } from '../../data/teams'

const ROUND_ORDER: MatchId[][] = [
  ['r32_m1','r32_m2','r32_m3','r32_m4','r32_m5','r32_m6','r32_m7','r32_m8'],
  ['r16_m1','r16_m2','r16_m3','r16_m4'],
  ['qf_m1','qf_m2'],
  ['sf_m1'],
  ['final'],
  ['sf_m2'],
  ['qf_m3','qf_m4'],
  ['r16_m5','r16_m6','r16_m7','r16_m8'],
  ['r32_m9','r32_m10','r32_m11','r32_m12','r32_m13','r32_m14','r32_m15','r32_m16'],
]

export const BracketCanvas = forwardRef<HTMLDivElement>((_, ref) => {
  const matches = bracketStore.getState().matches

  return (
    <div
      ref={ref}
      style={{
        width: 1200, height: 800,
        position: 'fixed', top: -9999, left: -9999,
        background: '#0f172a',
        display: 'flex', alignItems: 'center', gap: 8, padding: 16,
      }}
    >
      {ROUND_ORDER.map((ids, col) => (
        <div key={col} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: '100%', gap: 4, minWidth: 110 }}>
          {ids.map(id => {
            const winner = matches[id]?.winner ? getTeamById(matches[id].winner!) : null
            return (
              <div key={id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '6px 8px', fontSize: 11, color: winner ? '#fff' : '#475569', whiteSpace: 'nowrap' }}>
                {winner ? winner.name : 'TBD'}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
})
BracketCanvas.displayName = 'BracketCanvas'
