/** Shared key for standings row colors (1st / 2nd / 3rd / 4th). */
export function StandingsRankLegend({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-0.5 ${className}`}>
      <span className="text-gray-600">Colors by rank:</span>
      <span className="text-yellow-400">1st</span>
      <span className="text-blue-400">2nd</span>
      <span className="text-green-400">3rd</span>
      <span className="text-gray-500">4th</span>
    </p>
  )
}
