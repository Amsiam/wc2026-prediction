import { useEffect } from 'react'
import { fetchAndApplyResults } from '../lib/applyResults'

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000

/** Pull latest WC scores on load, then every 4 hours. */
export function useResultsSync() {
  useEffect(() => {
    let cancelled = false

    async function sync() {
      const result = await fetchAndApplyResults()
      if (cancelled || !result.ok) return
    }

    sync()
    const interval = setInterval(sync, FOUR_HOURS_MS)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])
}
