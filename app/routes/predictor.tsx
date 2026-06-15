import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '../components/AppShell'
import { useHydrate, usePersist } from '../hooks/usePersistence'
import { useResultsSync } from '../hooks/useResultsSync'

function PredictorPage() {
  useHydrate()
  usePersist()
  useResultsSync()
  return <AppShell />
}

export const Route = createFileRoute('/predictor')({
  validateSearch: (search: Record<string, unknown>) => ({
    p: typeof search.p === 'string' ? search.p : undefined,
  }),
  component: PredictorPage,
})
