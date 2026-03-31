import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '../components/AppShell'
import { useHydrate, usePersist } from '../hooks/usePersistence'

function PredictorPage() {
  useHydrate()
  usePersist()
  return <AppShell />
}

export const Route = createFileRoute('/predictor')({
  component: PredictorPage,
})
