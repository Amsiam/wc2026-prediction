import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SCHEDULE } from '../app/data/schedule.ts'
import { computeBracketQualifiers } from '../app/lib/computeBracketQualifiers.ts'
import { fetchWorldCupResults, formatResultsTs } from '../app/lib/fetchResults.ts'
import { formatAutoConfirmedTs } from '../app/lib/formatAutoConfirmed.ts'
import { alignKnockoutScoresToSchedule } from '../app/lib/knockoutParticipants.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

const data = await fetchWorldCupResults()

const { groups } = computeBracketQualifiers(
  data.scores,
  data.discipline,
  data.teamConduct,
  { completeOnly: true },
)

const alignedScores = alignKnockoutScoresToSchedule(data.scores, groups, data.knockout)
const syncedData = { ...data, scores: alignedScores }

const liveOut = resolve(__dirname, '../app/data/liveResults.ts')
writeFileSync(liveOut, formatResultsTs(syncedData), 'utf8')

const groupMatchNumbers = new Set(
  SCHEDULE.filter(m => m.round === 'Group Stage').map(m => m.matchNumber),
)
const groupScores = Object.fromEntries(
  Object.entries(syncedData.scores).filter(([n]) => groupMatchNumbers.has(Number(n))),
)

const autoConfirmedOut = resolve(__dirname, '../app/data/autoConfirmed.ts')
writeFileSync(autoConfirmedOut, formatAutoConfirmedTs({
  groups,
  scores: groupScores,
  discipline: Object.fromEntries(
    Object.entries(data.discipline).filter(([n]) => groupMatchNumbers.has(Number(n))),
  ),
  matches: data.knockout,
  syncedAt: data.syncedAt,
  source: data.source,
}), 'utf8')

const scoreCount = Object.keys(syncedData.scores).length
const conductCount = Object.keys(data.teamConduct).length
const koCount = Object.keys(data.knockout).length
const groupCount = Object.keys(groups).length

console.log(`Wrote ${liveOut}`)
console.log(`Wrote ${autoConfirmedOut}`)
console.log(`  source: ${data.source}`)
console.log(`  ${scoreCount} scores, ${conductCount} team fair-play rows, ${koCount} knockout winners`)
console.log(`  ${groupCount} confirmed groups (complete), ${Object.keys(groupScores).length} group scores locked`)
console.log(`  synced at ${data.syncedAt}`)
