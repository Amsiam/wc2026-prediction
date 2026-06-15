import { SCHEDULE } from '../data/schedule'
import { TEAMS } from '../data/teams'
import type { MatchId } from '../data/teams'
import type { MatchDiscipline } from './fairPlay'
import { EMPTY_MATCH_DISCIPLINE } from './fairPlay'
import { sourceNameToCanonical } from './openFootballNames'
import { resolveTeamId } from './standings'

export interface FetchedResults {
  scores: Record<number, { home: number; away: number }>
  discipline: Record<number, MatchDiscipline>
  knockout: Partial<Record<MatchId, string>>
  /** Team-level fair-play conduct from Wikipedia standings (higher = better). */
  teamConduct: Record<string, number>
  syncedAt: string
  source: string
}

const OPENFOOTBALL_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'

const WIKI_USER_AGENT = 'wc2026-predictor/1.0 (free open-data; educational project)'

const SCHEDULE_TO_BRACKET: Record<number, MatchId> = {
  73: 'r32_m1',  74: 'r32_m2',  75: 'r32_m3',  76: 'r32_m4',
  77: 'r32_m5',  78: 'r32_m6',  79: 'r32_m7',  80: 'r32_m8',
  81: 'r32_m9',  82: 'r32_m10', 83: 'r32_m11', 84: 'r32_m12',
  85: 'r32_m13', 86: 'r32_m14', 87: 'r32_m15', 88: 'r32_m16',
  89: 'r16_m1',  90: 'r16_m2',  91: 'r16_m3',  92: 'r16_m4',
  93: 'r16_m5',  94: 'r16_m6',  95: 'r16_m7',  96: 'r16_m8',
  97: 'qf_m1',   98: 'qf_m2',   99: 'qf_m3',   100: 'qf_m4',
  101: 'sf_m1',  102: 'sf_m2',
}

interface OpenFootballMatch {
  round?: string
  num?: number
  date?: string
  team1?: string
  team2?: string
  score?: { ft?: [number, number] }
  group?: string
}

interface OpenFootballData {
  matches: OpenFootballMatch[]
}

function scheduleNameForSource(name: string): string | undefined {
  const needle = sourceNameToCanonical(name)
  const team = TEAMS.find(t => sourceNameToCanonical(t.name) === needle)
  return team?.name
}

function findScheduleMatch(team1: string, team2: string, group?: string, num?: number) {
  if (num != null) {
    const byNum = SCHEDULE.find(m => m.matchNumber === num)
    if (byNum) return byNum
  }
  const a = sourceNameToCanonical(team1)
  const b = sourceNameToCanonical(team2)
  const groupLetter = group?.replace('Group ', '').trim()
  return SCHEDULE.find(m => {
    if (groupLetter && m.group !== groupLetter) return false
    const h = sourceNameToCanonical(m.homeTeam)
    const aw = sourceNameToCanonical(m.awayTeam)
    return (h === a && aw === b) || (h === b && aw === a)
  })
}

function teamIdFromName(name: string): string | undefined {
  const scheduleName = scheduleNameForSource(name)
  if (!scheduleName) return undefined
  return resolveTeamId(scheduleName, {})
}

async function fetchOpenFootball(): Promise<Pick<FetchedResults, 'scores' | 'discipline' | 'knockout'>> {
  const res = await fetch(OPENFOOTBALL_URL, {
    headers: { 'User-Agent': WIKI_USER_AGENT },
  })
  if (!res.ok) throw new Error(`openfootball ${res.status}`)
  const data = await res.json() as OpenFootballData

  const scores: FetchedResults['scores'] = {}
  const discipline: FetchedResults['discipline'] = {}
  const knockout: FetchedResults['knockout'] = {}

  for (const m of data.matches) {
    if (!m.team1 || !m.team2 || !m.score?.ft) continue
    const [g1, g2] = m.score.ft
    const sched = findScheduleMatch(m.team1, m.team2, m.group, m.num)
    if (!sched) continue

    const homeIsTeam1 = sourceNameToCanonical(sched.homeTeam) === sourceNameToCanonical(m.team1)
    const home = homeIsTeam1 ? g1 : g2
    const away = homeIsTeam1 ? g2 : g1

    scores[sched.matchNumber] = { home, away }
    discipline[sched.matchNumber] = EMPTY_MATCH_DISCIPLINE

    const bracketId = SCHEDULE_TO_BRACKET[sched.matchNumber]
    if (bracketId) {
      const winnerName = home > away ? sched.homeTeam : away > home ? sched.awayTeam : null
      if (winnerName) {
        const winnerId = resolveTeamId(winnerName, {})
        if (winnerId) knockout[bracketId] = winnerId
      }
    }
  }

  return { scores, discipline, knockout }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#160;|&nbsp;/g, ' ')
    .replace(/&minus;|−/g, '-')
}

function extractTeamName(cellHtml: string): string {
  let text = cellHtml
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<span[^>]*>[\s\S]*?<\/span>/gi, '')

  const anchor = text.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i)
  if (anchor) {
    text = anchor[1]
  } else {
    const titleMatch = text.match(/title="([^"]+)"/i)
    if (titleMatch) text = titleMatch[1]
  }

  return decodeHtmlEntities(text)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s*\(H\)\s*$/i, '')
    .replace(/\s+men'?s national soccer team$/i, '')
    .replace(/\s+men'?s national football team$/i, '')
    .replace(/\s+national football team$/i, '')
    .replace(/\s+football team$/i, '')
}

/** Parse Wikipedia "Discipline" fair-play table (FIFA conduct score column). */
function parseDisciplineSection(html: string): Record<string, number> {
  const out: Record<string, number> = {}
  const idx = html.search(/id="Discipline"|>\s*Discipline\s*</i)
  if (idx < 0) return out

  const fragment = html.slice(idx, idx + 30000)
  const tables = fragment.match(/<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>[\s\S]*?<\/table>/gi) ?? []

  for (const table of tables) {
    const rows = table.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) ?? []
    if (rows.length < 2) continue

    const headerText = rows[0].replace(/<[^>]+>/g, ' ').toLowerCase()
    if (!headerText.includes('team') || !headerText.includes('score')) continue

    for (const row of rows.slice(1)) {
      const cells = row.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) ?? []
      if (cells.length < 2) continue

      const teamText = extractTeamName(cells[0])
      const fpRaw = decodeHtmlEntities(cells[cells.length - 1].replace(/<[^>]+>/g, '').trim())
      const fp = parseInt(fpRaw, 10)
      if (!teamText || Number.isNaN(fp)) continue

      const teamId = teamIdFromName(teamText)
      if (teamId) out[teamId] = fp
    }
    if (Object.keys(out).length > 0) return out
  }

  return out
}

/** Parse fair play from standings wikitable (fallback). */
function parseGroupFairPlayHtml(html: string): Record<string, number> {
  const fromDiscipline = parseDisciplineSection(html)
  if (Object.keys(fromDiscipline).length > 0) return fromDiscipline

  const out: Record<string, number> = {}
  const tableMatch = html.match(/<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/i)
  if (!tableMatch) return out

  const rows = tableMatch[1].match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) ?? []
  if (rows.length < 2) return out

  const headerCells = rows[0].match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) ?? []
  const headers = headerCells.map(c => c.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase())
  const fpIdx = headers.findIndex(h =>
    h.includes('fair play') || h === 'fp' || h.includes('discipline') || h.includes('fairplay'),
  )
  if (fpIdx < 0) return out

  for (const row of rows.slice(1)) {
    const cells = row.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) ?? []
    if (cells.length <= fpIdx) continue

    const teamText = extractTeamName(cells[1] ?? cells[0])
    const fpRaw = cells[fpIdx].replace(/<[^>]+>/g, '').trim().replace(/−/g, '-').replace(/\+/g, '')
    const fp = parseInt(fpRaw, 10)
    if (!teamText || Number.isNaN(fp)) continue

    const teamId = teamIdFromName(teamText)
    if (teamId) out[teamId] = fp
  }

  return out
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

async function fetchWikipediaPageHtml(page: string): Promise<string> {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=text&format=json`
  const res = await fetch(url, { headers: { 'User-Agent': WIKI_USER_AGENT } })
  if (!res.ok) return ''
  const body = await res.text()
  try {
    const json = JSON.parse(body) as { parse?: { text?: string | { '*': string } } }
    const raw = json.parse?.text
    return typeof raw === 'string' ? raw : raw?.['*'] ?? ''
  } catch {
    return ''
  }
}

async function fetchWikipediaFairPlay(): Promise<Record<string, number>> {
  const conduct: Record<string, number> = {}
  const groups = 'ABCDEFGHIJKL'.split('')

  for (const g of groups) {
    try {
      const html = await fetchWikipediaPageHtml(`2026_FIFA_World_Cup_Group_${g}`)
      if (html) Object.assign(conduct, parseGroupFairPlayHtml(html))
    } catch {
      // Wikipedia optional — scores still work without it
    }
    await sleep(250)
  }

  return conduct
}

/** @internal exported for tests */
export function parseDisciplineSectionForTest(html: string): Record<string, number> {
  return parseDisciplineSection(html)
}

/** Fetch WC results from free public sources (no API key). */
export async function fetchWorldCupResults(): Promise<FetchedResults> {
  const [{ scores, discipline, knockout }, teamConduct] = await Promise.all([
    fetchOpenFootball(),
    fetchWikipediaFairPlay(),
  ])

  const sources = ['openfootball/worldcup.json']
  if (Object.keys(teamConduct).length > 0) sources.push('wikipedia')

  return {
    scores,
    discipline,
    knockout,
    teamConduct,
    syncedAt: new Date().toISOString(),
    source: sources.join(' + '),
  }
}

export function formatResultsTs(data: FetchedResults): string {
  return `// Auto-generated by scripts/sync-wc-results.ts — do not edit by hand
import type { MatchId } from './teams'
import type { MatchDiscipline } from '../lib/fairPlay'

export const LIVE_RESULTS = {
  scores: ${JSON.stringify(data.scores, null, 2)} as Record<number, { home: number; away: number }>,
  discipline: ${JSON.stringify(data.discipline, null, 2)} as Record<number, MatchDiscipline>,
  knockout: ${JSON.stringify(data.knockout, null, 2)} as Partial<Record<MatchId, string>>,
  teamConduct: ${JSON.stringify(data.teamConduct, null, 2)} as Record<string, number>,
  syncedAt: ${JSON.stringify(data.syncedAt)},
  source: ${JSON.stringify(data.source)},
}
`
}
