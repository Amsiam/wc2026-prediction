import { createFileRoute } from '@tanstack/react-router'
import { fetchWorldCupResults } from '../../lib/fetchResults'

export const Route = createFileRoute('/api/wc-results')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const results = await fetchWorldCupResults()
          return Response.json(results)
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Fetch failed'
          return Response.json({ error: message }, { status: 502 })
        }
      },
    },
  },
})
