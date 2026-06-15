import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchWorldCupResults, formatResultsTs } from '../app/lib/fetchResults.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

const data = await fetchWorldCupResults()
const out = resolve(__dirname, '../app/data/liveResults.ts')
writeFileSync(out, formatResultsTs(data), 'utf8')

const scoreCount = Object.keys(data.scores).length
const conductCount = Object.keys(data.teamConduct).length
const koCount = Object.keys(data.knockout).length
console.log(`Wrote ${out}`)
console.log(`  source: ${data.source}`)
console.log(`  ${scoreCount} scores, ${conductCount} team fair-play rows, ${koCount} knockout winners`)
console.log(`  synced at ${data.syncedAt}`)
