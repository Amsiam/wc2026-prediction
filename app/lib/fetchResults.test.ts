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

// Import parser by duplicating minimal test - actually test via fetchWorldCupResults mock
// We'll export parseDisciplineSection for test - or test through internal module

describe('Wikipedia discipline parsing', () => {
  it('parses fair play scores from discipline table HTML', async () => {
    const { parseDisciplineSectionForTest } = await import('./fetchResults')
    const conduct = parseDisciplineSectionForTest(GROUP_B_DISCIPLINE_HTML)
    expect(conduct).toEqual({ SUI: -1, CAN: -2, QAT: -2, BIH: -3 })
  })
})
