import { forwardRef } from 'react'
import { useStore } from 'zustand'
import { bracketStore } from '../../store/bracketStore'
import { getTeamById, R32_FIXTURES, BRACKET_TREE } from '../../data/teams'
import type { MatchId, GroupKey, SeedSource } from '../../data/teams'
import type { GroupPick } from '../../store/types'

// ─── constants ───────────────────────────────────────────────────────────────
const W = 1400
const H = 900
const MATCH_W = 126
const ROW_H = 24
const DIVIDER = 1

// Left bracket: R32 → R16 → QF → SF (reads left→right toward center)
const LEFT: [MatchId[], string][] = [
  [['r32_m2','r32_m5','r32_m1','r32_m3','r32_m11','r32_m12','r32_m9','r32_m10'], 'R32'],
  [['r16_m1','r16_m2','r16_m5','r16_m6'], 'R16'],
  [['qf_m1','qf_m2'], 'QF'],
  [['sf_m1'], 'SF'],
]

// Right bracket: SF → QF → R16 → R32 (reads left→right away from center)
const RIGHT: [MatchId[], string][] = [
  [['sf_m2'], 'SF'],
  [['qf_m3','qf_m4'], 'QF'],
  [['r16_m3','r16_m4','r16_m7','r16_m8'], 'R16'],
  [['r32_m4','r32_m6','r32_m7','r32_m8','r32_m14','r32_m16','r32_m13','r32_m15'], 'R32'],
]

// ─── helpers ─────────────────────────────────────────────────────────────────
function seedLabel(s: SeedSource): string {
  if (s.source === 'winner') return `1${s.group}`
  if (s.source === 'runner') return `2${s.group}`
  return `3(${s.groups?.join('')})`
}

function resolveR32(seed: SeedSource, groups: Record<GroupKey, GroupPick>, matchId: MatchId): string | null {
  if (seed.source === 'winner') return groups[seed.group!]?.first ?? null
  if (seed.source === 'runner') return groups[seed.group!]?.second ?? null
  for (const g of seed.groups ?? []) {
    const gp = groups[g as GroupKey]
    if (gp?.third && gp.thirdSlot === matchId) return gp.third
  }
  return null
}

// ─── TeamRow ─────────────────────────────────────────────────────────────────
function TeamRow({ teamId, label, isWinner, isLoser }: {
  teamId: string | null
  label: string
  isWinner: boolean
  isLoser: boolean
}) {
  const team = teamId ? getTeamById(teamId) : null
  return (
    <div style={{
      height: ROW_H,
      display: 'flex',
      alignItems: 'center',
      padding: '0 7px',
      background: isWinner ? 'rgba(20,83,45,0.55)' : 'transparent',
    }}>
      <span style={{
        fontFamily: 'Arial,Helvetica,sans-serif',
        fontSize: 9.5,
        fontWeight: isWinner ? 700 : 400,
        color: isWinner ? '#86efac' : isLoser ? '#374151' : '#94a3b8',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: MATCH_W - 14,
        letterSpacing: '0.01em',
      }}>
        {team ? team.name : label ? `(${label})` : '—'}
      </span>
    </div>
  )
}

// ─── MatchBox ────────────────────────────────────────────────────────────────
function MatchBox({ matchId }: { matchId: MatchId }) {
  const match = useStore(bracketStore, s => s.matches[matchId])
  const allMatches = useStore(bracketStore, s => s.matches)
  const groups = useStore(bracketStore, s => s.groups)
  const winner = match?.winner ?? null

  let homeId: string | null = null
  let awayId: string | null = null
  let homeLabel = ''
  let awayLabel = ''

  const tree = BRACKET_TREE as Record<string, readonly [string, string]>
  const fixture = R32_FIXTURES.find(f => f.id === matchId)
  const children = tree[matchId]

  if (matchId === 'third_place') {
    // Participants are the SF losers
    const sf1w = allMatches['sf_m1']?.winner ?? null
    const sf2w = allMatches['sf_m2']?.winner ?? null
    const sf1c = tree['sf_m1']
    const sf2c = tree['sf_m2']
    if (sf1c) {
      const p0 = allMatches[sf1c[0] as MatchId]?.winner ?? null
      const p1 = allMatches[sf1c[1] as MatchId]?.winner ?? null
      homeId = sf1w ? (p0 === sf1w ? p1 : p0) : null
    }
    if (sf2c) {
      const p0 = allMatches[sf2c[0] as MatchId]?.winner ?? null
      const p1 = allMatches[sf2c[1] as MatchId]?.winner ?? null
      awayId = sf2w ? (p0 === sf2w ? p1 : p0) : null
    }
    homeLabel = 'SF1 loser'
    awayLabel = 'SF2 loser'
  } else if (fixture) {
    homeId = resolveR32(fixture.home, groups, matchId)
    awayId = resolveR32(fixture.away, groups, matchId)
    homeLabel = seedLabel(fixture.home)
    awayLabel = seedLabel(fixture.away)
  } else if (children) {
    homeId = allMatches[children[0] as MatchId]?.winner ?? null
    awayId = allMatches[children[1] as MatchId]?.winner ?? null
  }

  const hasWinner = winner !== null
  const borderColor = hasWinner ? '#166534' : '#1e293b'

  return (
    <div style={{
      width: MATCH_W,
      background: '#0c1220',
      border: `1px solid ${borderColor}`,
      borderRadius: 3,
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <TeamRow
        teamId={homeId} label={homeLabel}
        isWinner={hasWinner && winner === homeId}
        isLoser={hasWinner && winner !== homeId}
      />
      <div style={{ height: DIVIDER, background: '#1e293b' }} />
      <TeamRow
        teamId={awayId} label={awayLabel}
        isWinner={hasWinner && winner === awayId}
        isLoser={hasWinner && winner !== awayId}
      />
    </div>
  )
}

// ─── RoundColumn ─────────────────────────────────────────────────────────────
function RoundCol({ matchIds, label }: { matchIds: MatchId[]; label: string }) {
  return (
    <div style={{ width: MATCH_W, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{
        height: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 7,
        fontFamily: 'Arial,sans-serif',
        color: '#334155',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}>
        {label}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
        {matchIds.map(id => <MatchBox key={id} matchId={id} />)}
      </div>
    </div>
  )
}

// ─── BracketCanvas ───────────────────────────────────────────────────────────
export const BracketCanvas = forwardRef<HTMLDivElement>((_, ref) => {
  const finalWinner = useStore(bracketStore, s => s.matches['final' as MatchId]?.winner ?? null)
  const thirdWinner = useStore(bracketStore, s => s.matches['third_place' as MatchId]?.winner ?? null)
  const champion = finalWinner ? getTeamById(finalWinner) : null
  const bronze = thirdWinner ? getTeamById(thirdWinner) : null

  return (
    <div ref={ref} style={{
      width: W,
      height: H,
      position: 'fixed',
      top: -9999,
      left: -9999,
      background: '#020817',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '10px 28px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        borderBottom: '1px solid #0f172a',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: 'Arial,sans-serif',
          fontSize: 17,
          fontWeight: 700,
          color: '#fbbf24',
          letterSpacing: '0.22em',
        }}>
          FIFA WORLD CUP 2026
        </div>
        <div style={{ width: 1, height: 18, background: '#1e293b' }} />
        <div style={{
          fontFamily: 'Arial,sans-serif',
          fontSize: 9,
          color: '#475569',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
          Bracket Prediction
        </div>
      </div>

      {/* ── Main bracket area ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'stretch',
        padding: '4px 28px 10px',
        gap: 6,
        minHeight: 0,
      }}>
        {/* Left rounds R32 → SF */}
        {LEFT.map(([ids, lbl], i) => (
          <RoundCol key={i} matchIds={ids} label={lbl} />
        ))}

        {/* ── Center column ── */}
        <div style={{
          flex: 1,
          minWidth: 180,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}>
          {/* Final label */}
          <div style={{
            fontFamily: 'Arial,sans-serif',
            fontSize: 7,
            color: '#334155',
            letterSpacing: '0.18em',
          }}>
            FINAL
          </div>

          {/* Final match box */}
          <MatchBox matchId={'final' as MatchId} />

          {/* Champion display */}
          {champion ? (
            <div style={{
              textAlign: 'center',
              padding: '7px 14px',
              background: 'rgba(251,191,36,0.06)',
              border: '1px solid rgba(251,191,36,0.18)',
              borderRadius: 6,
            }}>
              <div style={{
                fontFamily: 'Arial,sans-serif',
                fontSize: 7,
                color: '#b45309',
                letterSpacing: '0.2em',
                marginBottom: 4,
              }}>
                ⚽ WORLD CHAMPION
              </div>
              <div style={{
                fontFamily: 'Arial,sans-serif',
                fontSize: 15,
                fontWeight: 700,
                color: '#fde68a',
              }}>
                {champion.name}
              </div>
            </div>
          ) : (
            <div style={{
              fontFamily: 'Arial,sans-serif',
              fontSize: 9,
              color: '#1e293b',
              fontStyle: 'italic',
            }}>
              Champion TBD
            </div>
          )}

          {/* Divider */}
          <div style={{ width: 60, height: 1, background: '#1e293b' }} />

          {/* 3rd place */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'Arial,sans-serif',
              fontSize: 7,
              color: '#334155',
              letterSpacing: '0.15em',
              marginBottom: 5,
            }}>
              3RD PLACE
            </div>
            <MatchBox matchId={'third_place' as MatchId} />
            {bronze && (
              <div style={{
                fontFamily: 'Arial,sans-serif',
                fontSize: 9,
                color: '#92400e',
                marginTop: 5,
              }}>
                🥉 {bronze.name}
              </div>
            )}
          </div>
        </div>

        {/* Right rounds SF → R32 */}
        {RIGHT.map(([ids, lbl], i) => (
          <RoundCol key={i} matchIds={ids} label={lbl} />
        ))}
      </div>

      {/* ── Footer ── */}
      <div style={{
        borderTop: '1px solid #0f172a',
        padding: '5px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: 'Arial,sans-serif',
          fontSize: 9,
          color: '#475569',
          letterSpacing: '0.14em',
        }}>
          {window.location.host}
        </div>
      </div>
    </div>
  )
})
BracketCanvas.displayName = 'BracketCanvas'
