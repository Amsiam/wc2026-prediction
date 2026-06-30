import { describe, it, expect } from 'vitest'

// Minimal HTML mirroring Wikipedia Group B discipline table
const GROUP_B_DISCIPLINE_HTML = `
<h2><span class="mw-headline" id="Discipline">Discipline</span></h2>
<table class="wikitable">
<tr><th>Team</th><th>Match 1</th><th>Match 2</th><th>Match 3</th><th>Score</th></tr>
<tr>
<td><a href="/wiki/Switzerland_national_football_team" title="Switzerland national football team">Switzerland</a></td>
<td>1</td><td></td><td></td><td>−1</td>
</tr>
<tr>
<td><a href="/wiki/Canada_men%27s_national_soccer_team" title="Canada men's national soccer team">Canada</a></td>
<td>2</td><td></td><td></td><td>−2</td>
</tr>
<tr>
<td><a href="/wiki/Qatar_national_football_team" title="Qatar national football team">Qatar</a></td>
<td>2</td><td></td><td></td><td>−2</td>
</tr>
<tr>
<td><a href="/wiki/Bosnia_and_Herzegovina_national_football_team" title="Bosnia and Herzegovina national football team">Bosnia and Herzegovina</a></td>
<td>3</td><td></td><td></td><td>−3</td>
</tr>
</table>
`

// Wikipedia Group G uses en-dash (–) in score cells, not minus sign (−)
const GROUP_G_DISCIPLINE_HTML = `
<h2><span class="mw-headline" id="Discipline">Discipline</span></h2>
<table class="wikitable">
<tr><th>Team</th><th>Match 1</th><th>Match 2</th><th>Match 3</th><th>Score</th></tr>
<tr><td><a title="New Zealand men's national football team">New Zealand</a></td><td></td><td></td><td></td><td>0</td></tr>
<tr><td><a title="Iran national football team">Iran</a></td><td>1</td><td></td><td></td><td>–1</td></tr>
<tr><td><a title="Belgium national football team">Belgium</a></td><td>2</td><td></td><td></td><td>–2</td></tr>
<tr><td><a title="Egypt national football team">Egypt</a></td><td>2</td><td></td><td></td><td>–2</td></tr>
</table>
`

// Import parser by duplicating minimal test - actually test via fetchWorldCupResults mock
// We'll export parseDisciplineSection for test - or test through internal module

describe('Wikipedia discipline parsing', () => {
  it('parses fair play scores from discipline table HTML', async () => {
    const { parseDisciplineSectionForTest } = await import('./fetchResults')
    const conduct = parseDisciplineSectionForTest(GROUP_B_DISCIPLINE_HTML)
    expect(conduct).toEqual({ SUI: -1, CAN: -2, QAT: -2, BIH: -3 })
  })

  it('parses en-dash negative fair play scores (Wikipedia Group G)', async () => {
    const { parseDisciplineSectionForTest } = await import('./fetchResults')
    const conduct = parseDisciplineSectionForTest(GROUP_G_DISCIPLINE_HTML)
    expect(conduct).toEqual({ NZL: 0, IRN: -1, BEL: -2, EGY: -2 })
  })
})

describe('openfootball knockout parsing', () => {
  it('resolves R32 winner from real team names when schedule uses placeholders', async () => {
    const { parseOpenFootballKnockoutForTest } = await import('./fetchResults')
    const knockout = parseOpenFootballKnockoutForTest([
      {
        num: 73,
        team1: 'South Africa',
        team2: 'Canada',
        score: { ft: [1, 0] },
      },
    ])
    expect(knockout).toEqual({ r32_m1: 'RSA' })
  })

  it('resolves penalty shootout winner', async () => {
    const { parseOpenFootballKnockoutForTest } = await import('./fetchResults')
    const knockout = parseOpenFootballKnockoutForTest([
      {
        num: 73,
        team1: 'South Africa',
        team2: 'Canada',
        score: { ft: [0, 0], p: [4, 5] },
      },
    ])
    expect(knockout).toEqual({ r32_m1: 'CAN' })
  })

  it('stores pen tallies from openfootball `p` field', async () => {
    const { parseOpenFootballScoresForTest } = await import('./fetchResults')
    const scores = parseOpenFootballScoresForTest([
      {
        num: 73,
        team1: 'South Africa',
        team2: 'Canada',
        score: { p: [2, 3], et: [1, 1], ft: [1, 1], ht: [0, 0] },
      },
    ])
    expect(scores[73]).toEqual({ home: 1, away: 1, pens: { home: 3, away: 2 } })
  })
})
