import { GROUPS } from '../../data/teams'
import { GroupCard } from './GroupCard'
import { StandingsRankLegend } from './StandingsRankLegend'

export function GroupGrid() {
  return (
    <div className="max-w-7xl mx-auto">
      <StandingsRankLegend className="mb-3 px-1" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {GROUPS.map(g => (
          <GroupCard key={g} groupKey={g} />
        ))}
      </div>
    </div>
  )
}
