import { createFileRoute } from '@tanstack/react-router'
import { fetchWorldCupResults } from '../../lib/fetchResults'
import { computeBracketQualifiers } from '../../lib/computeBracketQualifiers'
import { alignKnockoutScoresToSchedule } from '../../lib/knockoutParticipants'

export const Route = createFileRoute('/api/wc-results')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await fetchWorldCupResults()
          const { groups } = computeBracketQualifiers(
            data.scores,
            data.discipline,
            data.teamConduct,
            { completeOnly: true },
          )
          const scores = alignKnockoutScoresToSchedule(data.scores, groups, data.knockout)
          return Response.json({ ...data, scores })
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Fetch failed'
          return Response.json({ error: message }, { status: 502 })
        }
      },
    },
  },
})
