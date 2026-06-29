import { THIRD_PLACE_SCENARIOS, resolveThirdSlots } from '../data/thirdPlaceScenarios'
import type { GroupKey, MatchId } from '../data/teams'
import type { GroupPick } from '../store/types'

type GroupsState = Record<GroupKey, GroupPick>

/** Resolve R32 third-place slots from the 495-scenario table (FIFA Annex C). */
export function applyThirdSlots(groups: GroupsState): GroupsState {
  const qualifying = (Object.keys(groups) as GroupKey[]).filter(g => groups[g].third !== null)
  let result: GroupsState = groups

  const locked = qualifying.filter(g => groups[g].thirdSlot !== null)
  const partial = qualifying.filter(g => groups[g].thirdSlot === null)

  const validScenarios = Object.entries(THIRD_PLACE_SCENARIOS).filter(([key, assignment]) => {
    const scenarioGroups = key.split('')
    if (!qualifying.every(g => scenarioGroups.includes(g))) return false
    if (qualifying.length === 8 && scenarioGroups.length !== 8) return false
    return locked.every(g => assignment[g] === groups[g].thirdSlot)
  })

  if (qualifying.length === 8) {
    const slots = validScenarios.length > 0
      ? validScenarios[0][1]
      : resolveThirdSlots(qualifying)
    for (const g of partial) {
      const newSlot = (slots[g] as MatchId | undefined) ?? null
      if (groups[g].thirdSlot !== newSlot) {
        if (result === groups) result = { ...groups }
        result = { ...result, [g]: { ...result[g], thirdSlot: newSlot } }
      }
    }
    return result
  }

  for (const g of partial) {
    const slots = new Set(validScenarios.map(([, a]) => a[g]).filter(Boolean))
    if (slots.size === 1) {
      const slot = [...slots][0] as MatchId
      if (result === groups) result = { ...groups }
      result = { ...result, [g]: { ...result[g], thirdSlot: slot } }
    }
  }

  return result
}
