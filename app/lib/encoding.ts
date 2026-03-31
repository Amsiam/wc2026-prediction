import { GROUPS, TEAMS, ALL_MATCH_IDS, getGroup } from '../data/teams'
import type { BracketState, GroupPick, MatchPick } from '../store/types'
import type { GroupKey, MatchId } from '../data/teams'

function emptyGroupPicks(): Record<GroupKey, GroupPick> {
  return Object.fromEntries(
    GROUPS.map(g => [g, { first: null, second: null, thirdRank: null }])
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

// Encoding scheme (revised):
// Groups: 9 bits × 12 groups = 108 bits
//   - 3 bits: first place index (0–3 = team index, 4 = null)
//   - 2 bits: second place index in remaining 3 teams (0–2, 3 = null)
//   - 4 bits: thirdRank (0 = null, 1–12 = rank)
// Matches: 6 bits × 32 matches = 192 bits
//   - values 0–47 = TEAMS index, 63 = null
// Total: 300 bits = 38 bytes → base64url ~51 chars

export function encodePicks(state: BracketState): string {
  const buf = new Uint8Array(38)
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

    // 4 bits: 0 = null, 1–12 = rank
    writeBits(buf, pos, pick.thirdRank ?? 0, 4)
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

    const pos = { v: 0 }
    const groups = emptyGroupPicks()

    for (const g of GROUPS) {
      const teams = getGroup(g)
      const firstVal = readBits(buf, pos, 3)
      const secondVal = readBits(buf, pos, 2)
      const rank = readBits(buf, pos, 4)

      if (firstVal < teams.length) {
        groups[g].first = teams[firstVal].id
        const remaining = teams.filter((_, i) => i !== firstVal)
        if (secondVal < remaining.length) {
          groups[g].second = remaining[secondVal].id
        }
      }
      groups[g].thirdRank = rank === 0 ? null : rank
    }

    const matches = emptyMatchPicks()
    for (const id of ALL_MATCH_IDS) {
      const teamIdx = readBits(buf, pos, 6)
      if (teamIdx !== 63 && teamIdx < TEAMS.length) {
        matches[id].winner = TEAMS[teamIdx].id
      }
    }

    return { groups, matches }
  } catch {
    return null
  }
}
