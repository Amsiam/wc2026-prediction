import { GROUPS, TEAMS, ALL_MATCH_IDS, getGroup, R32_FIXTURES } from '../data/teams'
import type { BracketState, GroupPick, MatchPick } from '../store/types'
import type { GroupKey, MatchId } from '../data/teams'

// r32_m1 → 0, r32_m2 → 1, …, r32_m16 → 15
const R32_IDS = Array.from({ length: 16 }, (_, i) => `r32_m${i + 1}`) as MatchId[]

function emptyGroupPicks(): Record<GroupKey, GroupPick> {
  return Object.fromEntries(
    GROUPS.map(g => [g, { first: null, second: null, third: null, thirdRank: null, thirdSlot: null }])
  ) as Record<GroupKey, GroupPick>
}

function emptyMatchPicks(): Record<MatchId, MatchPick> {
  return Object.fromEntries(
    ALL_MATCH_IDS.map(id => [id, { winner: null }])
  ) as Record<MatchId, MatchPick>
}

export const EMPTY_STATE: BracketState = {
  groups: emptyGroupPicks(),
  matches: emptyMatchPicks(),
}

function writeBits(buf: Uint8Array, bitPos: { v: number }, value: number, count: number) {
  for (let i = count - 1; i >= 0; i--) {
    const bit = (value >> i) & 1
    const byteIdx = Math.floor(bitPos.v / 8)
    const bitIdx = 7 - (bitPos.v % 8)
    if (bit) buf[byteIdx] |= 1 << bitIdx
    bitPos.v++
  }
}

function readBits(buf: Uint8Array, bitPos: { v: number }, count: number): number {
  let value = 0
  for (let i = count - 1; i >= 0; i--) {
    const byteIdx = Math.floor(bitPos.v / 8)
    const bitIdx = 7 - (bitPos.v % 8)
    if (buf[byteIdx] & (1 << bitIdx)) value |= 1 << i
    bitPos.v++
  }
  return value
}

// Encoding scheme:
// Groups: 17 bits × 12 groups = 204 bits
//   - 3 bits: first place index (0–3 = team index, 4 = null)
//   - 2 bits: second place index in remaining 3 teams (0–2, 3 = null)
//   - 3 bits: third place index (0–3 = team index, 4 = null)
//   - 4 bits: thirdRank (0 = null, 1–12 = rank)
//   - 5 bits: thirdSlot r32 index (0–15 = r32_m1–r32_m16, 31 = null)
// Matches: 6 bits × 32 matches = 192 bits
//   - values 0–47 = TEAMS index, 63 = null
// Total: 396 bits = 50 bytes → base64url ~67 chars

export function encodePicks(state: BracketState): string {
  const buf = new Uint8Array(50)
  const pos = { v: 0 }

  for (const g of GROUPS) {
    const pick = state.groups[g]
    const teams = getGroup(g)
    const firstIdx = pick.first ? teams.findIndex(t => t.id === pick.first) : -1

    // 3 bits: 0–3 = team index, 4 = null
    writeBits(buf, pos, firstIdx === -1 ? 4 : firstIdx, 3)

    if (firstIdx !== -1) {
      const remaining = teams.filter((_, i) => i !== firstIdx)
      const secondIdx = pick.second ? remaining.findIndex(t => t.id === pick.second) : -1
      // 2 bits: 0–2 = index in remaining, 3 = null
      writeBits(buf, pos, secondIdx === -1 ? 3 : secondIdx, 2)
    } else {
      writeBits(buf, pos, 3, 2) // null
    }

    // 3 bits: third place team index (0–3 = team index, 4 = null)
    const thirdIdx = pick.third ? teams.findIndex(t => t.id === pick.third) : -1
    writeBits(buf, pos, thirdIdx === -1 ? 4 : thirdIdx, 3)

    // 4 bits: 0 = null, 1–12 = rank
    writeBits(buf, pos, pick.thirdRank ?? 0, 4)

    // 5 bits: 0–15 = r32_m1–r32_m16 index, 31 = null
    const slotIdx = pick.thirdSlot ? R32_IDS.indexOf(pick.thirdSlot) : -1
    writeBits(buf, pos, slotIdx === -1 ? 31 : slotIdx, 5)
  }

  for (const id of ALL_MATCH_IDS) {
    const pick = state.matches[id]
    const teamIdx = pick.winner ? TEAMS.findIndex(t => t.id === pick.winner) : -1
    // 6 bits: 0–47 = TEAMS index, 63 = null
    writeBits(buf, pos, teamIdx === -1 ? 63 : teamIdx, 6)
  }

  let binary = ''
  buf.forEach(b => binary += String.fromCharCode(b))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function decodePicks(encoded: string): BracketState | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const pad = (4 - padded.length % 4) % 4
    const binary = atob(padded + '='.repeat(pad))
    const buf = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i)

    const isNewFormat = buf.length >= 50
    if (buf.length < 42) return null

    const pos = { v: 0 }
    const groups = emptyGroupPicks()

    for (const g of GROUPS) {
      const teams = getGroup(g)
      const firstVal = readBits(buf, pos, 3)
      const secondVal = readBits(buf, pos, 2)
      const thirdVal = readBits(buf, pos, 3)
      const rank = readBits(buf, pos, 4)

      if (firstVal < teams.length) {
        groups[g].first = teams[firstVal].id
        const remaining = teams.filter((_, i) => i !== firstVal)
        if (secondVal < remaining.length) {
          groups[g].second = remaining[secondVal].id
        }
      }
      if (thirdVal < teams.length) {
        groups[g].third = teams[thirdVal].id
      }
      groups[g].thirdRank = (rank === 0 || rank > 12) ? null : rank

      if (isNewFormat) {
        const slotVal = readBits(buf, pos, 5)
        groups[g].thirdSlot = slotVal < 16 ? R32_IDS[slotVal] : null
      }
    }

    const matches = emptyMatchPicks()
    for (const id of ALL_MATCH_IDS) {
      const teamIdx = readBits(buf, pos, 6)
      if (teamIdx !== 63 && teamIdx < TEAMS.length) {
        matches[id].winner = TEAMS[teamIdx].id
      }
    }

    // Backward compat: infer thirdSlot from match winners for old links
    if (!isNewFormat) {
      for (const g of GROUPS) {
        const thirdId = groups[g].third
        if (!thirdId) continue
        for (const f of R32_FIXTURES) {
          if (f.away.source === 'third' && f.away.groups?.includes(g as GroupKey)) {
            if (matches[f.id as MatchId]?.winner === thirdId) {
              groups[g].thirdSlot = f.id as MatchId
              break
            }
          }
        }
      }
    }

    // Infer missing group picks from R32 match winners so R32 slots display correctly
    for (const f of R32_FIXTURES) {
      const winnerId = matches[f.id as MatchId]?.winner
      if (!winnerId) continue
      const winnerTeam = TEAMS.find(t => t.id === winnerId)
      if (!winnerTeam) continue
      const g = winnerTeam.group as GroupKey

      if (f.home.source !== 'third' && f.home.group === g) {
        if (f.home.source === 'winner' && !groups[g].first) groups[g].first = winnerId
        else if (f.home.source === 'runner' && !groups[g].second) groups[g].second = winnerId
      } else if (f.away.source !== 'third' && f.away.group === g) {
        if (f.away.source === 'winner' && !groups[g].first) groups[g].first = winnerId
        else if (f.away.source === 'runner' && !groups[g].second) groups[g].second = winnerId
      } else if (f.away.source === 'third' && f.away.groups?.includes(g)) {
        if (!groups[g].third) { groups[g].third = winnerId; groups[g].thirdSlot = f.id as MatchId }
      }
    }

    return { groups, matches }
  } catch {
    return null
  }
}
