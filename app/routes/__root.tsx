import { createRootRoute, Outlet } from '@tanstack/react-router'
import '../styles.css'

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-gray-950 text-white">
      <Outlet />
    </div>
  ),
  head: () => ({
    meta: [
      { title: 'WC 2026 Predictor' },
      { name: 'description', content: 'Predict your 2026 FIFA World Cup bracket' },
    ],
  }),
})
