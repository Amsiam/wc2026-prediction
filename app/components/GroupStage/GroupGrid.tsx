import { GROUPS } from '../../data/teams'
import { GroupCard } from './GroupCard'

export function GroupGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
      {GROUPS.map(g => (
        <GroupCard key={g} groupKey={g} />
      ))}
    </div>
  )
}
