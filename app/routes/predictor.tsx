import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '../components/AppShell'
import { useHydrate, usePersist } from '../hooks/usePersistence'
import { useResultsSync } from '../hooks/useResultsSync'

function PredictorPage() {
  const { p } = Route.useSearch()
  useHydrate()
  usePersist()
  useResultsSync()
  return <AppShell initialTab={p ? 'knockout' : 'groups'} />
}

export const Route = createFileRoute('/predictor')({
  validateSearch: (search: Record<string, unknown>) => ({
    p: typeof search.p === 'string' ? search.p : undefined,
  }),
  component: PredictorPage,
})
