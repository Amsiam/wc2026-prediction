import { forwardRef } from 'react'
import { bracketStore } from '../../store/bracketStore'
import { getTeamById } from '../../data/teams'

export const WinnerCard = forwardRef<HTMLDivElement>((_, ref) => {
  const { matches } = bracketStore.getState()
  const champion = matches.final.winner ? getTeamById(matches.final.winner) : null
  const runnerUp = (() => {
    const sf1Winner = matches.sf_m1?.winner
    const sf2Winner = matches.sf_m2?.winner
    const finalWinner = matches.final.winner
    if (sf1Winner && sf1Winner !== finalWinner) return getTeamById(sf1Winner)
    if (sf2Winner && sf2Winner !== finalWinner) return getTeamById(sf2Winner)
    return null
  })()
  const third = matches.third_place?.winner ? getTeamById(matches.third_place.winner) : null

  const podium = [
    { place: '🥇', label: 'Champion', team: champion },
    { place: '🥈', label: 'Runner-up', team: runnerUp },
    { place: '🥉', label: '3rd Place', team: third },
  ]

  return (
    <div
      ref={ref}
      style={{
        width: 800, height: 450,
        position: 'fixed', top: -9999, left: -9999,
        background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 40,
      }}
    >
      <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: 0 }}>⚽ FIFA World Cup 2026</h1>
      <div style={{ display: 'flex', gap: 32 }}>
        {podium.map(({ place, label, team }) => (
          <div key={label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '16px 24px', minWidth: 180 }}>
            <div style={{ fontSize: 36 }}>{place}</div>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>{label}</div>
            {team ? (
              <>
                <div style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginTop: 12 }}>{team.name}</div>
              </>
            ) : (
              <div style={{ color: '#475569', fontSize: 14, marginTop: 12 }}>TBD</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
})
WinnerCard.displayName = 'WinnerCard'
