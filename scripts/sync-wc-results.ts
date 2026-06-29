import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchWorldCupResults, formatResultsTs } from '../app/lib/fetchResults.ts'
import { alignKnockoutScoresToSchedule } from '../app/lib/knockoutParticipants.ts'
import { computeBracketQualifiers } from '../app/lib/computeBracketQualifiers.ts'

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

const scoreCount = Object.keys(syncedData.scores).length
const conductCount = Object.keys(data.teamConduct).length
const koCount = Object.keys(data.knockout).length
const groupCount = Object.keys(groups).length

console.log(`Wrote ${liveOut}`)
console.log(`  source: ${data.source}`)
console.log(`  ${scoreCount} scores, ${conductCount} team fair-play rows, ${koCount} knockout winners`)
console.log(`  ${groupCount} confirmed groups (complete)`)
console.log(`  synced at ${data.syncedAt}`)
