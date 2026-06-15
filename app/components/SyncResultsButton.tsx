import { useState } from 'react'
import { LIVE_RESULTS } from '../data/liveResults'
import { fetchAndApplyResults } from '../lib/applyResults'

function formatSyncedAt(iso: string | null): string {
  if (!iso) return 'never'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'unknown'
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
}

export function SyncResultsButton() {
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState(LIVE_RESULTS.syncedAt)
  const [scoreCount, setScoreCount] = useState(Object.keys(LIVE_RESULTS.scores).length)
  const [error, setError] = useState<string | null>(null)

  async function handleSync() {
    setSyncing(true)
    setError(null)
    const result = await fetchAndApplyResults()
    setSyncing(false)
    if (result.ok) {
      setLastSynced(result.data.syncedAt)
      setScoreCount(Object.keys(result.data.scores).length)
    } else {
      setError(result.error)
    }
  }

  const title = [
    'Sync match results (openfootball + Wikipedia)',
    lastSynced ? `Last sync: ${formatSyncedAt(lastSynced)}` : null,
    scoreCount ? `${scoreCount} scores bundled` : null,
    error,
  ].filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={syncing}
      title={title}
      className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded bg-blue-800 hover:bg-blue-700 disabled:opacity-60 text-white whitespace-nowrap"
    >
      {syncing ? 'Syncing…' : 'Sync results'}
    </button>
  )
}
